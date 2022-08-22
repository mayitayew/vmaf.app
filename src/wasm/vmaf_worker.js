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

onmessage = function (e) {
    console.log("Webworker called");
    if (e.data.length < 4) {
        return;
    }
    const reference_file = e.data[0];
    const test_file = e.data[1];
    const use_phone_model = e.data[2];
    const use_neg_model = e.data[3];

    var vmafScoresBuffer = new VmafScoresBuffer(ffModule, 10000);
    ffModule.FS.mkdir('/videos');
    ffModule.FS.mount(ffModule.WORKERFS, {files: [reference_file, test_file]}, '/videos');
    ffModule.computeVmaf('/videos/' + reference_file.name, '/videos/' + test_file.name, vmafScoresBuffer.getHeapAddress(),
        use_phone_model, use_neg_model);
    postMessage([vmafScoresBuffer.getScoreData()]);
}