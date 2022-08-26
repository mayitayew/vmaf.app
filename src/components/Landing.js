import React, {useEffect, useState, useRef, useCallback} from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import {ThemeProvider, Toolbar, useScrollTrigger} from "@mui/material";
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import {CssBaseline} from "@mui/material";
import VideoFileTwoToneIcon from '@mui/icons-material/VideoFileTwoTone';
import FunctionsTwoToneIcon from '@mui/icons-material/FunctionsTwoTone';
import MenuItem from '@mui/material/MenuItem';
import logo from '../assets/logo.png';
import InputLabel from '@mui/material/InputLabel';
import theme from "./Theme";
import {green, grey} from "@mui/material/colors";
import Select from '@mui/material/Select';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import {Line} from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const graphOptions = {
    responsive: true,
    legend: {
        display: false,
    },
    scales: {
        x: {
            display: false //this will remove all the x-axis grid lines
        },
    },
    plugins: {
        title: {
            display: true,
            text: 'Vmaf Scores Graph',
        },
    },
};

const data = (vmafScores) => {
    const labels = vmafScores.map(function (elem, index) {
        return index;
    });
    return {
        labels: labels,
        datasets: [
            {
                label: "Frame's vmaf score",
                pointRadius: 0.5,
                data: vmafScores.map((x) => x),
                borderColor: green[500],
                borderWidth: 0.8,
                backgroundColor: green[500],
            },
        ],
    }
};

function VmafGraph({vmafScores}) {
    const graphData = data(vmafScores);
    return (
        <Container maxWidth="md">
            <Line width="854px" height="480px" options={graphOptions} data={graphData}/>
        </Container>);
}

function ElevationScroll(props) {
    const {children} = props;

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    return React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
    });
}

function presentableFilename(filename) {
    if (filename.length <= 20) {
        return filename;
    }

    return filename.substring(0, 17) + "..";
}

const FrameCanvas = ({displayFrame}) => {
    const ref = useRef()

    const canvasStyle = {borderStyle: "solid", borderColor: '#125071', borderWidth: "4px"}

    useEffect(() => {
        if (ref.current) {
            const canvas = ref.current.getContext('2d');
            const clampedArray = Uint8ClampedArray.from(displayFrame);
            const imgData = new ImageData(clampedArray, 1920);
          //  canvas.putImageData(imgData, 0, 0);
          //   const arr = new Uint8ClampedArray(480*360*4);
          //
          //   // Fill the array with the same RGBA values
          //   for (let i = 0; i < arr.length; i += 4) {
          //       arr[i + 0] = 0;    // R value
          //       arr[i + 1] = 190;  // G value
          //       arr[i + 2] = 0;    // B value
          //       arr[i + 3] = 255;  // A value
          //   }
          //
          //   // Initialize a new ImageData object
          //   let imageData = new ImageData(arr, 480);

            // Draw image data to the canvas
            canvas.putImageData(imgData, 0, 0, 0, 0, 1920, 1080);

        }
    }, [])

    return (
        <Grid container justifyContent="center" spacing={0.5}>
            <Grid item>
                <canvas ref={ref} width="1920px" height="1080px" style={canvasStyle}/>
            </Grid>
            {/*<Grid item>*/}
            {/*    <canvas ref={ref} width="480px" height="360px" style={canvasStyle}/>*/}
            {/*</Grid>*/}
        </Grid>)
}


const ComparisonCanvas = ({displayFrame}) => {

    const comparisonSlider = {
        position: "relative",
        width: "920px",
        height: "360px",
        borderWidth: "3px",
        borderColor: grey[100],
        borderStyle: "solid"
    };

    const dividerStyle = {
        position: "absolute",
        width: "2px",
        height: "100%",
        backgroundColor: grey[100],
        left: "50%",
        top: "0",
        bottom: "0",
        marginLeft: "-1px",
    };

    return (
        <>
            {/*<div style={comparisonSlider}>*/}
            <FrameCanvas displayFrame={displayFrame}/>
            {/*<div style={dividerStyle}/>*/}
            {/*<FrameCanvas/>*/}
            {/*</div>*/}
        </>
    )
}

const Inputs = () => {

    const [inputsState, setInputsState] = useState(() => {
        return {
            referenceVideoFilename: "",
            referenceVideoFile: null,
            distortedVideoFilename: "",
            distortedVideoFile: null,
            vmafModel: "HD",
        }
    });

    const [outputsState, setOutputsState] = useState(() => {
        return {
            pooledVmafScore: "",
            vmafScores: null,
            fps: null,
            framesProcessed: null,
            totalNumFrames: null,
            displayFrame: null,
        }
    });

    const [state, setState] = useState(() => {
        return {
            showGraph: false,
            currentState: "NOT_STARTED", // One of [PROCESSING, DONE, NOT_STARTED]
        }
    });

    const workerRef = useRef()
    const intervalRef = useRef()
    useEffect(() => {
            workerRef.current = new Worker(new URL('../wasm/vmaf_worker.js', import.meta.url));
            workerRef.current.onmessage = (evt) => {
                if (typeof evt.data[0] === 'string') {
                    if (evt.data[0] === "ClearInterval") {
                        console.log("Clearing interval...");
                        clearInterval(intervalRef.current);
                        return;
                    }
                    return;
                }

                intervalRef.current = setInterval(() => {
                    // workerRef.current.postMessage(["RequestingBuffer"]);
                    setOutputsState(prevState => {
                        const outputBuffer = evt.data[0];

                        const totalNumFrames = outputBuffer[0];
                        const framesProcessed = outputBuffer[1];
                        const fps = outputBuffer[2];
                        console.log(fps);
                        const vmafScores = outputBuffer[3 + framesProcessed];

                        const displayFrame = evt.data[1];
                        console.log("Frame data is ", displayFrame);
                        return {
                            ...prevState,
                            totalNumFrames,
                            framesProcessed,
                            fps,
                            vmafScores,
                            displayFrame,
                        };
                    });
                }, 1000);
                return;

            }
            return () => {
                workerRef.current.terminate()
            }
        }, []
    );

    const computeVmafInWebworker = useCallback(async () => {
        console.log("Ready to call compute.")
        const use_phone_model = inputsState.vmafModel.includes("Phone");
        const use_neg_model = inputsState.vmafModel.includes("Neg");
        if (inputsState.referenceVideoFile !== null) {
            workerRef.current.postMessage([inputsState.referenceVideoFile, inputsState.distortedVideoFile, use_phone_model, use_neg_model, intervalRef]);
            setTimeout(() => {
                setState(prevState => {
                    return {
                        ...prevState,
                        currentState: "PROCESSING",
                    };
                });
            }, 300);
        }
    }, [state, inputsState])

    const cancelVmafCompute = () => {

    }

    function handleReferenceVideoChange(event) {
        if (event.target.files.length > 0) {
            setInputsState(prevState => {
                return {
                    ...prevState,
                    referenceVideoFilename: presentableFilename(event.target.files[0].name),
                    referenceVideoFile: event.target.files[0],
                };
            });
            console.log(inputsState);
        }
    }

    function handleDistortedVideoChange(event) {
        if (event.target.files.length > 0) {
            setInputsState(prevState => {
                return {
                    ...prevState,
                    distortedVideoFilename: presentableFilename(event.target.files[0].name),
                    distortedVideoFile: event.target.files[0],
                };
            });
            console.log(inputsState);
        }
    }

    function inputsProvided() {
        return inputsState.referenceVideoFile !== null &&
            inputsState.distortedVideoFile !== null;
    }

    const referenceButtonText = () => {
        if (inputsState.referenceVideoFilename.length === 0) {
            return <Typography>Reference video</Typography>
        }
        return <Typography
            color="secondary">{inputsState.referenceVideoFilename}</Typography>
    }

    const distortedButtonText = () => {
        if (inputsState.distortedVideoFilename.length === 0) {
            return <Typography>Distorted video</Typography>
        }
        return <Typography
            color="secondary">{inputsState.distortedVideoFilename}</Typography>
    }

    const VmafModelSelect = () => {
        const handleChange = (event) => {
            setInputsState(prevState => {
                return {
                    ...prevState,
                    vmafModel: event.target.value,
                };
            });
        };

        return (
            <FormControl sx={{m: 1, minWidth: 120}} size="small">
                <InputLabel id="demo-select-small">Vmaf Model</InputLabel>
                <Select
                    labelId="demo-select-small"
                    id="demo-select-small"
                    value={inputsState.vmafModel}
                    label="Vmaf Model"
                    onChange={handleChange}
                >
                    <MenuItem value="HD">HD</MenuItem>
                    <MenuItem value="HD-Neg">HD NEG mode</MenuItem>
                    <MenuItem value="Phone">Phone</MenuItem>
                    <MenuItem value="Phone-Neg">Phone NEG mode</MenuItem>
                </Select>
            </FormControl>
        );
    }


    const ProgressInfo = () => {
        if (outputsState.framesProcessed === null) {
            return (
                <Typography color="secondary" variant="subtitle1" marginTop="5px">
                    Select a reference video, a distorted video, and a VMAF model to get started.
                </Typography>
            )
        }
        const fps = outputsState.fps.toFixed(2);
        return (
            <Typography color="secondary" variant="subtitle1" marginTop="5px">
                {outputsState.framesProcessed} frames {fps} FPS
            </Typography>
        )
    }

    const buttonSize = {maxWidth: '230px', minWidth: '230px', textTransform: 'none'};

    const ComputeOrCancelButton = () => {

        if (state.currentState === "PROCESSING") {
            return (
                <Button variant="contained" color="textSecondary"
                        onClick={computeVmafInWebworker}
                        style={buttonSize}>
                    Cancel
                </Button>
            )
        }


        return (
            <Button variant="contained" disabled={!inputsProvided()} color="secondary"
                    onClick={computeVmafInWebworker}
                    startIcon={<FunctionsTwoToneIcon/>} style={buttonSize}>
                Compute VMAF
            </Button>
        )
    }

    return (<>
        {/*{outputsState.displayFrame === null ? null : <FrameCanvas displayFrame={outputsState.displayFrame}/>}*/}
        {<ProgressInfo/>}
        <Grid container spacing={1} paddingTop={4} justifyContent="center">
            <Grid item xs={3}>
                <Button style={buttonSize} for="reference-video-upload" variant="contained" component="label"
                        startIcon={<VideoFileTwoToneIcon/>}>
                    {referenceButtonText()}
                </Button>
                <input hidden accept="video/mp4" type="file" id="reference-video-upload"
                       onChange={handleReferenceVideoChange}/>
            </Grid>
            <Grid item xs={3}>
                <Button style={buttonSize} for="distorted-video-upload" variant="contained" component="label"
                        startIcon={<VideoFileTwoToneIcon/>}>
                    {distortedButtonText()}
                </Button>
                <input hidden accept="video/mp4" type="file" id="distorted-video-upload"
                       onChange={handleDistortedVideoChange}/>
            </Grid>
        </Grid>
        <Grid container spacing={1} paddingTop={2} justifyContent="center" direction="column" alignItems="center">
            <Grid item xs={4}>
                <VmafModelSelect/>
            </Grid>
            <Grid item xs={4}>
                {<ComputeOrCancelButton/>}
            </Grid>
            <Grid item xs={4}>
                {outputsState.pooledVmafScore.length !== 0 ?
                    <Typography variant="h3"
                                color="textSecondary">Score: {outputsState.pooledVmafScore}</Typography>
                    :
                    null
                }
            </Grid>
        </Grid>
    </>)
}

export default function Landing() {

    const appBarStyle = {
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: grey[200],
        backgroundColor: theme.palette.background.default
    };

    const logoContainer = {padding: 0, hover: {backgroundColor: "transparent"}};

    const logoStyle = {height: "4em", [theme.breakpoints.down("md")]: {height: "3.4em"}}

    const tabStyle = {minWidth: 10, font: "lato", fontWeight: 450, fontSize: "1.5rem"};

    const tabListStyle = {marginLeft: "25px", textTransform: "none"};

    const featurePointStyle = {marginBottom: "1rem"}

    const buttonStyle = {
        borderRadius: "5px",
        marginRight: "25px",
        textTransform: "none",
        textDecoration: "none",
        fontWeight: 350,
        fontSize: "1rem"
    };

    const innerContainerStyle = {
        maxWidth: "100%",
        marginTop: "20px",
        paddingY: "20px",
        paddingTop: "10px",
        paddingX: "30px"
    };

    const tabs = (
        <>
            <Typography marginLeft="3px" marginTop="auto" marginRight="auto" color="secondary" style={tabStyle}>
                vmaf.web
            </Typography>
            <div style={tabListStyle}>
                <Button style={buttonStyle} variant="contained" color="textSecondary">
                    About
                </Button>
                <Button style={buttonStyle} variant="contained" color="textSecondary">
                    Give feedback
                </Button>
            </div>
        </>
    )

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Container maxWidth="lg" align="center">
                <ElevationScroll>
                    <AppBar position="relative" style={appBarStyle}>
                        <Toolbar disableGutters>
                            <Button disableRipple style={logoContainer}>
                                <img src={logo} style={logoStyle} alt={"logo"}/>
                            </Button>
                            {tabs}
                        </Toolbar>
                    </AppBar>
                </ElevationScroll>

                {/*<LeftSideContent/>*/}

                <Grid container style={innerContainerStyle} direction="column" justifyContent="center"
                      alignItems="center">
                    <Inputs/>
                </Grid>
            </Container>
        </ThemeProvider>
    );
}