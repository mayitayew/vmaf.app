# Vmaf.dev 

Vmaf.dev (https://vmaf.dev) is a web app that computes the VMAF video quality metric on your browser. 
It takes in a pair of videos (e.g mp4s), automatically resizes them to the appropriate resolution, converts
to raw format and computes the VMAF score for each frame. It also shows you the highest and lowest 
quality frames in the video.

It uses [libvmaf](https://github.com/Netflix/vmaf/blob/master/libvmaf/README.md) and the FFmpeg libraries
compiled to webassembly to process videos on browser. That part of the code is [here](https://github.com/mayitayew/ffvmaf).

If you use VMAF with FFmpeg from the command line to measure video quality, this is an alternative
you can use to compute the metric and examine how video quality varies across frames.
