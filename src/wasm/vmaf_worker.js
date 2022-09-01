import Module from './ffvmaf_wasm_lib.js';
import VmafScoresBuffer from '../vmaf_scores_buffer';
import FrameBuffer from "../frame_buffer";

let ffModule = undefined;
let vmafScoresBuffer = undefined;
let maxScoreReferenceFrameBuffer = undefined
let maxScoreDistortedFrameBuffer = undefined;
let minScoreReferenceFrameBuffer = undefined;
let minScoreDistortedFrameBuffer = undefined;

Module().then(module => {
    ffModule = module;
    vmafScoresBuffer = new VmafScoresBuffer(ffModule, 10000);
    maxScoreReferenceFrameBuffer = new FrameBuffer(ffModule, 480 * 360 * 4);
    maxScoreDistortedFrameBuffer = new FrameBuffer(ffModule, 480 * 360 * 4);
    minScoreReferenceFrameBuffer = new FrameBuffer(ffModule, 480 * 360 * 4);
    minScoreDistortedFrameBuffer = new FrameBuffer(ffModule, 480 * 360 * 4);

    ffModule.FS.mkdir('/videos');

    console.log('ffModule loaded');
}).catch(e => {
    console.log('Module() error: ' + e);
});

onmessage = function (e) {
    if (ffModule === undefined) {
        console.log("FFmodule is not ready.");
        return;
    }

    const reference_file = e.data[0];
    const test_file = e.data[1];
    const use_phone_model = e.data[2];
    const use_neg_model = e.data[3];

    ffModule.FS.mount(ffModule.WORKERFS, {files: [reference_file, test_file]}, '/videos');
    const reference_filepath = '/videos/' + reference_file.name;
    const test_filepath = '/videos/' + test_file.name;
    postMessage([vmafScoresBuffer.getScoreData(), maxScoreReferenceFrameBuffer.getFrameData(),
        maxScoreDistortedFrameBuffer.getFrameData(), minScoreReferenceFrameBuffer.getFrameData(),
        minScoreDistortedFrameBuffer.getFrameData()]);
    const return_value = ffModule.computeVmaf(reference_filepath, test_filepath, maxScoreReferenceFrameBuffer.getHeapAddress(), maxScoreDistortedFrameBuffer.getHeapAddress(), minScoreReferenceFrameBuffer.getHeapAddress(), minScoreDistortedFrameBuffer.getHeapAddress(), vmafScoresBuffer.getHeapAddress(),
        use_phone_model, use_neg_model);
    ffModule.FS.unmount('/videos');
    switch (return_value) {
        case -1:
            postMessage(["Initialization_Error"]);
            break;
        case 0:
            postMessage(["Done"]);
            break;
        case 1:
            postMessage(["Input_Video_Error"]);
            break;
        case 2:
            postMessage(["Cancelled"]);
            break;
        case 3:
            postMessage(["Vmaf_Error"]);
            break;
        default:
            postMessage(["Unknown_Error"]);
    }
}