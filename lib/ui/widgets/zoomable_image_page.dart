import 'dart:io';

import 'package:flutter/material.dart';

/// Full-screen photo viewer with pinch zoom / pan.
class ZoomableImagePage extends StatelessWidget {
  const ZoomableImagePage({
    super.key,
    required this.imagePath,
    this.title = 'Photo',
  });

  final String imagePath;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(title),
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.8,
          maxScale: 5,
          child: Image.file(
            File(imagePath),
            fit: BoxFit.contain,
            errorBuilder: (_, _, _) => const Icon(
              Icons.broken_image_outlined,
              color: Colors.white54,
              size: 64,
            ),
          ),
        ),
      ),
    );
  }
}
