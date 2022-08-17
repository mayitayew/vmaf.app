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
import {grey} from "@mui/material/colors";

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

// Initialize ffVmaf wasm module.


const Inputs = () => {

    const workerRef = useRef()
    useEffect(() => {
        workerRef.current = new Worker(new URL('../wasm/vmaf_worker.js', import.meta.url));
        workerRef.current.onmessage = (evt) =>
            alert(`WebWorker Response => ${evt.data}`)
        return () => {
            workerRef.current.terminate()
        }
    }, []);

    const [state, setState] = useState(() => {
        return {
            referenceVideoFilename: "",
            referenceVideoFile: null,
            distortedVideoFilename: "",
            distortedVideoFile: null,
            computedVmafScore: "",
        }
    });

    const computeVmafInWebworker = useCallback(async () => {
        console.log("Ready to call compute.")
        if (state.referenceVideoFile !== null) {
            workerRef.current.postMessage([state.referenceVideoFile])
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

const VideoCanvas = () => {

    const comparisonSlider = {
        position: "relative",
        width: "1280px",
        height: "720px",
        borderWidth: "5px",
        borderColor: "white",
        borderStyle: "solid"
    };

    const dividerStyle = {
        position: "absolute",
        width: "4px",
        height: "100%",
        backgroundColor: "white",
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

const VmafGraph = () => {

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
        backgroundColor: "#EEE",
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
                                <img src={logo} style={logoStyle}/>
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
                    {/*<VideoCanvas/>*/}
                    <Inputs/>
                </Grid>
            </Container>
        </ThemeProvider>
    );
}