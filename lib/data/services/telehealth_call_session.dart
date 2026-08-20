import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

enum TelehealthRole { patient, doctor }

/// Firestore-signaled WebRTC call between Suwasiri App and GP Care.
class TelehealthCallSession {
  TelehealthCallSession({
    required this.appointmentId,
    required this.role,
    FirebaseFirestore? db,
  }) : _db = db ?? FirebaseFirestore.instance;

  final String appointmentId;
  final TelehealthRole role;
  final FirebaseFirestore _db;

  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  RTCPeerConnection? _pc;
  MediaStream? _local;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _sessionSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _iceSub;
  bool _closed = false;
  bool _remoteDescSet = false;
  bool _answered = false;
  final _pendingIce = <RTCIceCandidate>[];

  DocumentReference<Map<String, dynamic>> get _session =>
      _db.collection('telehealth_sessions').doc(appointmentId);

  CollectionReference<Map<String, dynamic>> get _myIce => _session.collection(
        role == TelehealthRole.doctor ? 'ice_doctor' : 'ice_patient',
      );

  CollectionReference<Map<String, dynamic>> get _theirIce => _session.collection(
        role == TelehealthRole.doctor ? 'ice_patient' : 'ice_doctor',
      );

  Future<void> start({
    required void Function() onRemote,
    required void Function(String status) onStatus,
  }) async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();

    _local = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': {
        'facingMode': 'user',
        'width': 640,
        'height': 480,
      },
    });
    localRenderer.srcObject = _local;

    _pc = await createPeerConnection({
      'sdpSemantics': 'unified-plan',
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun1.l.google.com:19302'},
      ],
    });

    for (final track in _local!.getTracks()) {
      await _pc!.addTrack(track, _local!);
    }

    _pc!.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        remoteRenderer.srcObject = event.streams[0];
        onRemote();
      }
    };

    _pc!.onIceCandidate = (candidate) {
      if (candidate.candidate == null || candidate.candidate!.isEmpty) return;
      _myIce.add({
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
        'at': FieldValue.serverTimestamp(),
      });
    };

    _iceSub = _theirIce.snapshots().listen((snap) async {
      for (final change in snap.docChanges) {
        if (change.type != DocumentChangeType.added) continue;
        final data = change.doc.data();
        if (data == null) continue;
        final ice = RTCIceCandidate(
          data['candidate'] as String?,
          data['sdpMid'] as String?,
          data['sdpMLineIndex'] as int?,
        );
        if (!_remoteDescSet) {
          _pendingIce.add(ice);
        } else {
          await _pc?.addCandidate(ice);
        }
      }
    });

    if (role == TelehealthRole.doctor) {
      final offer = await _pc!.createOffer();
      await _pc!.setLocalDescription(offer);
      await _session.set({
        'appointmentId': appointmentId,
        'offer': {'sdp': offer.sdp, 'type': offer.type},
        'answer': null,
        'doctorJoined': true,
        'status': 'connecting',
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      onStatus('calling');
    } else {
      await _session.set({
        'appointmentId': appointmentId,
        'patientJoined': true,
        'status': 'lobby',
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      onStatus('waiting');
    }

    _sessionSub = _session.snapshots().listen((snap) async {
      if (_closed || !snap.exists) return;
      final data = snap.data();
      if (data == null) return;
      if (data['status'] == 'ended') {
        onStatus('ended');
        return;
      }

      if (role == TelehealthRole.patient) {
        await _handlePatientSignal(data, onStatus);
      } else {
        await _handleDoctorSignal(data, onStatus);
      }
    });
  }

  Future<void> _handlePatientSignal(
    Map<String, dynamic> data,
    void Function(String status) onStatus,
  ) async {
    if (_answered) return;
    final offer = data['offer'];
    if (offer is! Map) return;
    final sdp = offer['sdp'] as String?;
    final type = offer['type'] as String?;
    if (sdp == null || sdp.isEmpty || _pc == null) return;

    _answered = true;
    await _pc!.setRemoteDescription(RTCSessionDescription(sdp, type));
    _remoteDescSet = true;
    await _flushIce();
    final answer = await _pc!.createAnswer();
    await _pc!.setLocalDescription(answer);
    await _session.set({
      'answer': {'sdp': answer.sdp, 'type': answer.type},
      'patientJoined': true,
      'status': 'live',
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    onStatus('live');
  }

  Future<void> _handleDoctorSignal(
    Map<String, dynamic> data,
    void Function(String status) onStatus,
  ) async {
    if (_remoteDescSet) return;
    final answer = data['answer'];
    if (answer is! Map) return;
    final sdp = answer['sdp'] as String?;
    final type = answer['type'] as String?;
    if (sdp == null || sdp.isEmpty || _pc == null) return;

    await _pc!.setRemoteDescription(RTCSessionDescription(sdp, type));
    _remoteDescSet = true;
    await _flushIce();
    await _session.set({
      'doctorJoined': true,
      'status': 'live',
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    onStatus('live');
  }

  Future<void> _flushIce() async {
    for (final ice in _pendingIce) {
      await _pc?.addCandidate(ice);
    }
    _pendingIce.clear();
  }

  Future<void> setMuted(bool muted) async {
    _local?.getAudioTracks().forEach((t) => t.enabled = !muted);
  }

  Future<void> setCameraOff(bool off) async {
    _local?.getVideoTracks().forEach((t) => t.enabled = !off);
  }

  Future<void> hangup() async {
    if (_closed) return;
    _closed = true;
    await _sessionSub?.cancel();
    await _iceSub?.cancel();
    try {
      await _session.set({
        'status': 'ended',
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (_) {}
    try {
      await _pc?.close();
    } catch (_) {}
    try {
      await _local?.dispose();
    } catch (_) {}
    await localRenderer.dispose();
    await remoteRenderer.dispose();
  }
}
