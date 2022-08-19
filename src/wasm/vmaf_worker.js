import Module from './ffvmaf_wasm_lib.js';
import VmafScoresBuffer from '../vmaf_scores_buffer';

let ffModule;

Module().then(module => {
    ffModule = module;
    console.log('ffModule loaded');
    console.log('Vmaf version is ' + ffModule.getVmafVersion());
}).catch(e => {
    console.log('Module() error: ' + e);
});

onmessage = function(e) {
    console.log("Webworker called");
    console.log("Received message. Vmaf version is " + ffModule.getVmafVersion());
    const reference_file = e.data[0];
    const test_file = e.data[1];

    var vmafScoresBuffer = new VmafScoresBuffer(ffModule, 100);
    ffModule.FS.mkdir('/videos');
    ffModule.FS.mount(ffModule.WORKERFS, {files: [reference_file, test_file]}, '/videos');
    if (e.data.length > 0) {
        console.log("File is ", reference_file.name);
        ffModule.computeVmaf('/videos/' + reference_file.name, '/videos/' + test_file.name, vmafScoresBuffer.getHeapAddress());
        postMessage([vmafScoresBuffer.getScoreData()]);
    }
}