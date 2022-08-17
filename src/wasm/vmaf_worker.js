import Module from './ffvmaf_wasm_lib.js';

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
    const f = e.data[0];

    ffModule.FS.mkdir('/wjzm');
    ffModule.FS.mount(ffModule.WORKERFS, {files: [f]}, '/wjzm');
    if (e.data.length > 0) {
        console.log("File is ", f.name);
        ffModule.computeVmaf('/wjzm/' + f.name, '/wjzm/' + f.name);
    }
}