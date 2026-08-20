import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "../firebase";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type TelehealthCallStatus = "idle" | "connecting" | "live" | "ended" | "error";

export interface TelehealthCallHandle {
  hangup: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  setCameraOn: (on: boolean) => void;
}

export async function startDoctorTelehealthCall(opts: {
  appointmentId: string;
  localVideo: HTMLVideoElement;
  remoteVideo: HTMLVideoElement;
  onStatus: (status: TelehealthCallStatus) => void;
}): Promise<TelehealthCallHandle> {
  const db = getFirebaseDb();
  const sessionRef = doc(db, "telehealth_sessions", opts.appointmentId);
  const myIce = collection(sessionRef, "ice_doctor");
  const theirIce = collection(sessionRef, "ice_patient");

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const unsubs: Unsubscribe[] = [];
  let remoteSet = false;
  const pendingIce: RTCIceCandidateInit[] = [];
  let closed = false;

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { facingMode: "user", width: 640, height: 480 },
  });
  opts.localVideo.srcObject = localStream;
  opts.localVideo.muted = true;
  await opts.localVideo.play().catch(() => undefined);
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  pc.ontrack = (ev) => {
    const [stream] = ev.streams;
    if (stream) {
      opts.remoteVideo.srcObject = stream;
      opts.remoteVideo.play().catch(() => undefined);
      opts.onStatus("live");
    }
  };

  pc.onicecandidate = (ev) => {
    if (!ev.candidate) return;
    addDoc(myIce, {
      candidate: ev.candidate.candidate,
      sdpMid: ev.candidate.sdpMid,
      sdpMLineIndex: ev.candidate.sdpMLineIndex,
      at: Date.now(),
    }).catch(() => undefined);
  };

  const flushIce = async () => {
    for (const c of pendingIce) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        /* ignore late candidates */
      }
    }
    pendingIce.length = 0;
  };

  unsubs.push(
    onSnapshot(theirIce, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const d = change.doc.data();
        const init: RTCIceCandidateInit = {
          candidate: d.candidate,
          sdpMid: d.sdpMid,
          sdpMLineIndex: d.sdpMLineIndex,
        };
        if (!remoteSet) pendingIce.push(init);
        else pc.addIceCandidate(init).catch(() => undefined);
      });
    })
  );

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await setDoc(
    sessionRef,
    {
      appointmentId: opts.appointmentId,
      offer: { sdp: offer.sdp, type: offer.type },
      answer: null,
      doctorJoined: true,
      status: "connecting",
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  opts.onStatus("connecting");

  unsubs.push(
    onSnapshot(sessionRef, async (snap) => {
      if (closed || !snap.exists()) return;
      const data = snap.data();
      if (data?.status === "ended") {
        opts.onStatus("ended");
        return;
      }
      const answer = data?.answer as { sdp?: string; type?: RTCSdpType } | null;
      if (answer?.sdp && !remoteSet) {
        try {
          await pc.setRemoteDescription({ type: answer.type || "answer", sdp: answer.sdp });
          remoteSet = true;
          await flushIce();
          await setDoc(
            sessionRef,
            { status: "live", doctorJoined: true, updatedAt: Date.now() },
            { merge: true }
          );
        } catch (err) {
          console.warn("telehealth answer", err);
        }
      }
    })
  );

  const hangup = async () => {
    if (closed) return;
    closed = true;
    unsubs.forEach((u) => u());
    try {
      await setDoc(sessionRef, { status: "ended", updatedAt: Date.now() }, { merge: true });
    } catch {
      /* ignore */
    }
    pc.getSenders().forEach((s) => s.track?.stop());
    localStream.getTracks().forEach((t) => t.stop());
    pc.close();
    opts.localVideo.srcObject = null;
    opts.remoteVideo.srcObject = null;
    opts.onStatus("ended");
  };

  return {
    hangup,
    setMuted: (muted) => {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    },
    setCameraOn: (on) => {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = on;
      });
    },
  };
}
