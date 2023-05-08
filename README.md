# Vmaf.dev 

Vmaf.dev (https://vmaf.dev) is a web app that computes the VMAF video quality metric on your browser. 
It takes in a pair of videos (e.g mp4s), automatically resizes them to the appropriate resolution, converts
to raw format and computes the VMAF score for each frame. It also shows you the highest and lowest 
quality frames in the video.

It uses [libvmaf](https://github.com/Netflix/vmaf/blob/master/libvmaf/README.md) and the FFmpeg libraries
compiled to webassembly to process videos on browser. That part of the code is [here](https://github.com/mayitayew/ffvmaf).

If you use VMAF with FFmpeg from the command line to measure video quality, this is an alternative
you can use to compute the metric and examine how video quality varies across frames.

<img width="1123" alt="InProgressView (1)" src="https://user-images.githubusercontent.com/85318352/236891637-1be0f890-7df8-4c95-9c76-c29b4b1a56a1.png">

<img width="1030" alt="ComputeDoneView (1)" src="https://user-images.githubusercontent.com/85318352/236891581-64f39692-f12a-4b1e-9462-db72ca0cb0d5.png">

<img width="923" alt="VmafScoreGraphView (1)" src="https://user-images.githubusercontent.com/85318352/236891660-98734f41-6db9-45af-8bdf-87e20cb44edc.png">
