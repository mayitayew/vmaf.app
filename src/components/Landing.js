import React, {useEffect, useState, useRef, useCallback} from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import {ThemeProvider, Toolbar, useScrollTrigger} from "@mui/material";
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {CssBaseline} from "@mui/material";
import VideoFileTwoToneIcon from '@mui/icons-material/VideoFileTwoTone';
import FunctionsTwoToneIcon from '@mui/icons-material/FunctionsTwoTone';
import {LoadingButton} from '@mui/lab';
import logo from '../assets/logo.png';
import theme from "./Theme";
import {green, grey, red} from "@mui/material/colors";

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
    scales:{
        x: {
            display: false //this will remove all the x-axis grid lines
        }
    },
    plugins: {
        title: {
            display: true,
            text: 'Graph',
        },
    },
};

const data = (vmafScores) => {
    vmafScores = vmafScores.slice(0, 90);
    const labels = vmafScores.map(function(elem, index) {
       return index;
    });
    return {
        labels: labels,
        datasets: [
            {
                label: 'Frame Vmaf Score',
                data: vmafScores.map((x) => x),
                borderColor: green[500],
                backgroundColor: red[200],
            },
        ],
    }
};

function VmafGraph({vmafScores}) {
    const graphData = data(vmafScores);
    return <Line options={graphOptions} data={graphData}/>;
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
        width: "1280px",
        height: "720px",
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
            vmafScores: null,
        }
    });

    const workerRef = useRef()
    useEffect(() => {
        workerRef.current = new Worker(new URL('../wasm/vmaf_worker.js', import.meta.url));
        workerRef.current.onmessage = (evt) =>
        {
            console.log("Received message from worker");
            setState(prevState => {
                return {
                    ...prevState,
                    vmafScores: evt.data[0],
                };
            });
        }
        return () => {
            workerRef.current.terminate()
        }
    }, [state]);

    const computeVmafInWebworker = useCallback(async () => {
        console.log("Ready to call compute.")
        if (state.referenceVideoFile !== null) {
            workerRef.current.postMessage([state.referenceVideoFile, state.distortedVideoFile])
        }
        console.log(state.vmafScores)
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
            return <Typography>SELECT REFERENCE VIDEO</Typography>
        }
        return <Typography
            color="secondary">{state.referenceVideoFilename}</Typography>
    }

    const distortedButtonText = () => {
        if (state.distortedVideoFilename.length === 0) {
            return <Typography>SELECT DISTORTED VIDEO</Typography>
        }
        return <Typography
            color="secondary">{state.distortedVideoFilename}</Typography>
    }

    const buttonSize = {maxWidth: '230px', minWidth: '230px', textTransform: 'none'};

    return (<>
        <Grid container spacing={2} paddingTop={4} justifyContent="center">
            {state.vmafScores === null ? <VideoCanvas/>: <VmafGraph vmafScores={state.vmafScores}/>}
            <Grid item xs={6}>
                <Button style={buttonSize} for="reference-video-upload" variant="contained" component="label"
                        startIcon={<VideoFileTwoToneIcon/>}>
                    {referenceButtonText()}
                </Button>
                <input hidden accept="video/mp4" type="file" id="reference-video-upload"
                       onChange={handleReferenceVideoChange}/>
            </Grid>
            <Grid item xs={6}>
                <Button style={buttonSize} for="distorted-video-upload" variant="contained" component="label"
                        startIcon={<VideoFileTwoToneIcon/>}>
                    {distortedButtonText()}
                </Button>
                <input hidden accept="video/mp4" type="file" id="distorted-video-upload"
                       onChange={handleDistortedVideoChange}/>
            </Grid>
        </Grid>
        <Grid container spacing={2} paddingTop={4} justifyContent="center" direction="column">
            <Grid item xs={5}>
                <LoadingButton variant="contained" disabled={!inputsProvided()} color="secondary" onClick={computeVmafInWebworker}
                               startIcon={<FunctionsTwoToneIcon/>}>
                    Compute VMAF score
                </LoadingButton>
            </Grid>
            <Grid item xs={5}>
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
                <Button style={buttonStyle} variant="contained" color="secondary">
                    Sign up
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
                {/*<Typography variant="h6" gutterBottom color="textPrimary" marginTop="20px">*/}
                {/*    Compute VMAF and visualize video quality, entirely on your browser.*/}
                {/*</Typography>*/}
                <Grid container style={innerContainerStyle} direction="column" justifyContent="center"
                      alignItems="center">
                    <Inputs/>
                </Grid>
            </Container>
        </ThemeProvider>
    );
}