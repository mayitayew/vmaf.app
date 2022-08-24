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
import {LoadingButton} from '@mui/lab';
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
    vmafScores = vmafScores.slice(0, 350);
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

const VideoCanvas = () => {

    const comparisonSlider = {
        position: "relative",
        width: "854px",
        height: "480px",
        borderWidth: "5px",
        borderColor: grey[100],
        borderStyle: "solid"
    };

    const dividerStyle = {
        position: "absolute",
        width: "4px",
        height: "100%",
        backgroundColor: grey[100],
        left: "50%",
        top: "0",
        bottom: "0",
        marginLeft: "-1px",
        cursor: "ew-resize"
    };

    const style = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "solid 1px #ddd",
        background: "#f0f0f0"
    };

    return (
        <>
            <div style={comparisonSlider}>
                <div style={dividerStyle}>
                </div>
            </div>
        </>
    )
}

const Inputs = () => {

    const [state, setState] = useState(() => {
        return {
            referenceVideoFilename: "",
            referenceVideoFile: null,
            distortedVideoFilename: "",
            distortedVideoFile: null,
            computedVmafScore: "",
            vmafModel: "HD",
            vmafScores: null,
            fps: null,
            framesProcessed: null,
            totalNumFrames: null,
        }
    });

    const workerRef = useRef()
    const [workerState, setWorkerState] = useState(() => {
        workerRef.current = new Worker(new URL('../wasm/vmaf_worker.js', import.meta.url));
        workerRef.current.onmessage = (evt) => {
            console.log("Received message from worker");
            setState(prevState => {
                const outputBuffer = evt.data[0];
                return {
                    ...prevState,
                    vmafScores: outputBuffer.slice(0, outputBuffer[0]),
                    totalNumFrames: outputBuffer[0],
                    framesProcessed: outputBuffer[1],
                    fps: outputBuffer[2],
                };
            });
            console.log(state.totalNumFrames);
        }
        // const interval = setInterval(() => {
        //     workerRef.current.postMessage(["start"]);
        // }, 1000);
        return () => {
            workerRef.current.terminate()
        }
    }, state)

   // useEffect(() => {
        // workerRef.current = new Worker(new URL('../wasm/vmaf_worker.js', import.meta.url));
        // workerRef.current.onmessage = (evt) => {
        //     console.log("Received message from worker");
        //     setState(prevState => {
        //         const outputBuffer = evt.data[0];
        //         return {
        //             ...prevState,
        //             vmafScores: outputBuffer.slice(0, outputBuffer[0]),
        //             totalNumFrames: outputBuffer[0],
        //             framesProcessed: outputBuffer[1],
        //             fps: outputBuffer[2],
        //         };
        //     });
        // }
        // const interval = setInterval(() => {
        //     workerRef.current.postMessage(["start"]);
        // }, 1000);
        // return () => {
        //     workerRef.current.terminate()
        // }
   // }, [state]);

    const computeVmafInWebworker = useCallback(async () => {
        console.log("Ready to call compute.")
        const use_phone_model = state.vmafModel.includes("Phone");
        const use_neg_model = state.vmafModel.includes("Neg");
        if (state.referenceVideoFile !== null) {
            workerRef.current.postMessage([state.referenceVideoFile, state.distortedVideoFile, use_phone_model, use_neg_model])
        }
    }, [state])

    function handleReferenceVideoChange(event) {
        if (event.target.files.length > 0) {
            setState(prevState => {
                return {
                    ...prevState,
                    referenceVideoFilename: presentableFilename(event.target.files[0].name),
                    referenceVideoFile: event.target.files[0],
                    computedVmafScore: "",
                };
            });
            console.log(state);
        }
    }

    function handleDistortedVideoChange(event) {
        if (event.target.files.length > 0) {
            setState(prevState => {
                return {
                    ...prevState,
                    distortedVideoFilename: presentableFilename(event.target.files[0].name),
                    distortedVideoFile: event.target.files[0],
                    computedVmafScore: "",
                };
            });
            console.log(state);
        }
    }

    function inputsProvided() {
        return state.referenceVideoFile !== null &&
            state.distortedVideoFile !== null;
    }

    const referenceButtonText = () => {
        if (state.referenceVideoFilename.length === 0) {
            return <Typography>Reference video</Typography>
        }
        return <Typography
            color="secondary">{state.referenceVideoFilename}</Typography>
    }

    const distortedButtonText = () => {
        if (state.distortedVideoFilename.length === 0) {
            return <Typography>Distorted video</Typography>
        }
        return <Typography
            color="secondary">{state.distortedVideoFilename}</Typography>
    }

    const VmafModelSelect = () => {
        const handleChange = (event) => {
            setState(prevState => {
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
                    value={state.vmafModel}
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

    const buttonSize = {maxWidth: '230px', minWidth: '230px', textTransform: 'none'};

    return (<>
        {state.vmafScores === null ? <VideoCanvas/> : <VmafGraph vmafScores={state.vmafScores}/>}
        <Typography color="secondary" variant="subtitle1" marginTop="5px">
            Select a reference video, a distorted video, and a VMAF model to get started.
        </Typography>
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
                <LoadingButton variant="contained" disabled={!inputsProvided()} color="secondary"
                               onClick={computeVmafInWebworker}
                               startIcon={<FunctionsTwoToneIcon/>}>
                    Compute VMAF score
                </LoadingButton>
            </Grid>
            <Grid item xs={4}>
                {state.computedVmafScore.length !== 0 ?
                    <Typography variant="h3"
                                color="textSecondary">Score: {state.computedVmafScore}</Typography>
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