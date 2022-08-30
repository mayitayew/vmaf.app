import React, {useEffect, useState, useRef, useCallback} from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import {DialogContent, DialogContentText, DialogTitle, ThemeProvider, Toolbar, useScrollTrigger} from "@mui/material";
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import {CssBaseline} from "@mui/material";
import VideoFileTwoToneIcon from '@mui/icons-material/VideoFileTwoTone';
import FunctionsTwoToneIcon from '@mui/icons-material/FunctionsTwoTone';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuItem from '@mui/material/MenuItem';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Dialog from '@mui/material/Dialog';
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
            text: 'Vmaf score graph',
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
                label: "Vmaf score at frame",
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
            <Line width="854px" height="360px" options={graphOptions} data={graphData}/>
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

const Inputs = () => {

    const [selectedState, setSelectedState] = useState(() => {
        return {
            computeVmaf: true,
            encodingLadder: false,
        }
    })

    const SelectStateTabs = () => {

        const selectStyle = {marginBottom: "20px"}

        const tabButtonStyle = {
            fontSize: "1.125rem",
            lineHeight: "1.75rem",
            color: grey[600],
            textTransform: "none",
        }

        const handleComputeVmafTabClick = () => {
            setSelectedState(prevState => {
                return {
                    computeVmaf: true,
                    encodingLadder: false,
                }
            })
        }

        const handleEncodingLadderTabClick = () => {
            setSelectedState(prevState => {
                return {
                    computeVmaf: false,
                    encodingLadder: true,
                }
            })
        }

        const selectedTabButtonStyle = {
            fontSize: "1.125rem",
            fontWeight: 700,
            lineHeight: "1.75rem",
            color: theme.palette.secondary.main,
            textTransform: "none",
        }

        if (selectedState.computeVmaf === true) {
            return (
                <Grid container spacing={3} justifyContent="center" style={selectStyle}>
                    <Grid item>
                        <Button variant="outlined" style={selectedTabButtonStyle} onClick={handleComputeVmafTabClick}>Compute
                            VMAF</Button>
                    </Grid>
                    <Grid item>
                        <Button variant="outlined" style={tabButtonStyle}
                                onClick={handleEncodingLadderTabClick}>Encoding ladder</Button>
                    </Grid>
                </Grid>
            )
        }

        return (
            <Grid container spacing={3} justifyContent="center" style={selectStyle}>
                <Grid item>
                    <Button variant="outlined" style={tabButtonStyle} onClick={handleComputeVmafTabClick}>Compute
                        VMAF</Button>
                </Grid>
                <Grid item>
                    <Button variant="outlined" style={selectedTabButtonStyle}
                            onClick={handleEncodingLadderTabClick}>Encoding ladder</Button>
                </Grid>
            </Grid>
        )
    }

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
            maxVmafScore: "",
            minVmafScore: "",
            vmafScores: null,
            fps: null,
            framesProcessed: null,
            totalNumFrames: null,
            maxScoreReferenceFrame: null,
            maxScoreDistortedFrame: null,
            minScoreReferenceFrame: null,
            minScoreDistortedFrame: null,
            outputBuffer: null,
        }
    });

    const [state, setState] = useState(() => {
        return {
            showGraph: false,
            showMaxScoreFrames: false,
            showMinScoreFrames: false,
            currentState: "NOT_STARTED", // One of [NOT_STARTED, PROCESSING, DONE]
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

                        setOutputsState(prevState => {
                            const pooledVmafScore = prevState.outputBuffer === null ? "" : prevState.outputBuffer[4 + prevState.totalNumFrames];
                            const maxVmafScore = prevState.outputBuffer === null ? "" : prevState.outputBuffer[5 + prevState.totalNumFrames];
                            const minVmafScore = prevState.outputBuffer === null ? "" : prevState.outputBuffer[6 + prevState.totalNumFrames];
                            const vmafScores = prevState.outputBuffer === null ? null : prevState.outputBuffer.slice(4, 4 + prevState.framesProcessed - 2);
                            return {
                                ...prevState,
                                pooledVmafScore,
                                maxVmafScore,
                                minVmafScore,
                                vmafScores,
                            }
                        })

                        setState(prevState => {
                            const newState = prevState.currentState === "PROCESSING" ? "DONE" : "NOT_STARTED";
                            return {
                                ...prevState,
                                currentState: newState,
                            }
                        });
                        return;
                    }
                    return;
                }

                setTimeout(() => {
                    setState(prevState => {
                        return {
                            ...prevState,
                            currentState: "PROCESSING"
                        }
                    })
                }, 500);

                intervalRef.current = setInterval(() => {

                    const outputBuffer = evt.data[0];

                    setOutputsState(prevState => {
                        const totalNumFrames = outputBuffer[0];
                        const framesProcessed = outputBuffer[1];
                        const fps = outputBuffer[2];
                        const maxScoreReferenceFrame = evt.data[1];
                        const maxScoreDistortedFrame = evt.data[2];
                        const minScoreReferenceFrame = evt.data[3];
                        const minScoreDistortedFrame = evt.data[4];
                        return {
                            ...prevState,
                            totalNumFrames,
                            framesProcessed,
                            fps,
                            maxScoreReferenceFrame,
                            maxScoreDistortedFrame,
                            minScoreReferenceFrame,
                            minScoreDistortedFrame,
                            outputBuffer,
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
        workerRef.current.postMessage([inputsState.referenceVideoFile, inputsState.distortedVideoFile, use_phone_model, use_neg_model, intervalRef]);
    }, [state, inputsState])

    const cancelVmafCompute = () => {
        outputsState.outputBuffer[3] = -999;
        setState(prevState => {
            return {
                currentState: "NOT_STARTED",
                showMaxScoreFrames: false,
                showGraph: false,
                showMinScoreFrames: false,
            }
        });

        setOutputsState(prevState => {
            return {
                pooledVmafScore: "",
                maxVmafScore: "",
                minVmafScore: "",
                vmafScores: null,
                fps: null,
                framesProcessed: null,
                totalNumFrames: null,
                maxScoreReferenceFrame: null,
                maxScoreDistortedFrame: null,
                minScoreReferenceFrame: null,
                minScoreDistortedFrame: null,
                outputBuffer: null,
            }
        });
    }

    const computeDone = () => {
        setState(prevState => {
            return {
                currentState: "NOT_STARTED",
                showMaxScoreFrames: false,
                showGraph: false,
                showMinScoreFrames: false,
            }
        });

        setOutputsState(prevState => {
            return {
                pooledVmafScore: "",
                maxVmafScore: "",
                minVmafScore: "",
                vmafScores: null,
                fps: null,
                framesProcessed: null,
                totalNumFrames: null,
                maxScoreReferenceFrame: null,
                maxScoreDistortedFrame: null,
                minScoreReferenceFrame: null,
                minScoreDistortedFrame: null,
                outputBuffer: null,
            }
        });
    }

    const showGraph = () => {
        setState(prevState => {
            return {
                ...prevState,
                showMaxScoreFrames: false,
                showMinScoreFrames: false,
                showGraph: true
            }
        });
    }

    const showMaxScoreFrames = () => {
        setState(prevState => {
            return {
                ...prevState,
                showMinScoreFrames: false,
                showGraph: false,
                showMaxScoreFrames: true,
            }
        });
    }

    const showMinScoreFrames = () => {
        setState(prevState => {
            return {
                ...prevState,
                showMaxScoreFrames: false,
                showMinScoreFrames: true,
                showGraph: false,
            }
        });
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
            <FormControl sx={{m: 1, minWidth: 180}} size="small">
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

    const FrameCanvas = ({leftFrame, rightFrame}) => {
        const refOne = useRef()
        const refTwo = useRef()

        const canvasStyle = {borderStyle: "solid", borderColor: '#125071', borderWidth: "2px"}

        useEffect(() => {
            if (refOne.current && leftFrame !== null) {
                const canvas = refOne.current.getContext('2d');
                const clampedArray = Uint8ClampedArray.from(leftFrame);
                const imgData = new ImageData(clampedArray, 480);
                canvas.putImageData(imgData, 0, 0);
            }
            if (refTwo.current && rightFrame !== null) {
                const canvas = refTwo.current.getContext('2d');
                const clampedArray = Uint8ClampedArray.from(rightFrame);
                const imgData = new ImageData(clampedArray, 480);
                canvas.putImageData(imgData, 0, 0);
            }
        }, [leftFrame, rightFrame])

        return (
            <Grid container justifyContent="center" spacing={0.5}>
                <Grid item>
                    <canvas ref={refOne} width="480px" height="360px" style={canvasStyle}/>
                </Grid>
                <Grid item>
                    <canvas ref={refTwo} width="480px" height="360px" style={canvasStyle}/>
                </Grid>
            </Grid>)
    }

    const ProgressInfo = () => {
        if (state.currentState === "NOT_STARTED") {
            return (
                <Typography color="secondary" variant="subtitle1" marginTop="5px">
                    Select a reference video, a distorted video, and a VMAF model to get started.
                </Typography>
            )
        }

        if (state.currentState === "DONE") {
            const pooledScore = outputsState.pooledVmafScore.toFixed(2);
            const highestScore = outputsState.maxVmafScore.toFixed(2);
            const lowestScore = outputsState.minVmafScore.toFixed(2);
            return (
                <Typography color="secondary" variant="subtitle1" marginTop="5px">
                    Done. Highest score: <b>{highestScore}</b>, Lowest score: <b>{lowestScore}</b> Pooled score: <b>{pooledScore}</b>
                </Typography>
            )
        }

        if (state.currentState === "PROCESSING") {
            const fps = outputsState.fps === null ? 0 : outputsState.fps.toFixed(2);
            const framesProcessed = outputsState.framesProcessed === null ? 0 : outputsState.framesProcessed;
            const totalNumFrames = outputsState.totalNumFrames === null ? "unknown" : outputsState.totalNumFrames;
            return (
                <Typography color="secondary" variant="subtitle1" marginTop="5px">
                    Processed {framesProcessed} of ~{totalNumFrames} frame pairs.
                    Rate: {fps} FPS
                </Typography>
            )
        }
    }

    const DisplayArea = () => {
        if (state.showGraph) {
            return (<VmafGraph vmafScores={outputsState.vmafScores}/>);
        }
        if (state.showMinScoreFrames) {
            return (<FrameCanvas leftFrame={outputsState.minScoreReferenceFrame}
                                 rightFrame={outputsState.minScoreDistortedFrame}/>);
        }
        if (state.showMaxScoreFrames) {
            return (<FrameCanvas leftFrame={outputsState.maxScoreReferenceFrame}
                                 rightFrame={outputsState.maxScoreReferenceFrame}/>);
        }
        return (<FrameCanvas leftFrame={outputsState.minScoreReferenceFrame}
                             rightFrame={outputsState.minScoreDistortedFrame}/>);
    }

    const buttonSize = {maxWidth: '230px', minWidth: '230px', textTransform: 'none'};

    const thinButtonSize = {maxWidth: '230px', maxHeight: '30px', textTransform: 'none'}

    const ComputeOrCancelButton = () => {

        if (state.currentState === "PROCESSING") {
            return (
                <Button variant="contained" color="textSecondary"
                        onClick={cancelVmafCompute}
                        style={buttonSize}>
                    In progress. Click to cancel
                </Button>
            )
        }

        if (state.currentState === "NOT_STARTED") {
            return (
                <Button variant="contained" disabled={!inputsProvided()} color="secondary"
                        onClick={computeVmafInWebworker}
                        startIcon={<FunctionsTwoToneIcon/>} style={buttonSize}>
                    Compute VMAF
                </Button>
            )
        }

        if (state.currentState === "DONE") {
            return (
                <Button variant="contained" color="secondary"
                        onClick={computeDone}
                        style={buttonSize}>
                    Done
                </Button>
            )
        }


    }

    const AdditionalButtons = () => {
        if (state.currentState !== "DONE") {
            return (<></>);
        }
        return (
            <Grid container spacing={2} justifyContent="center">
                <Grid item>
                    <Button variant="contained" color="primary"
                            onClick={showMaxScoreFrames}
                            style={thinButtonSize}>
                        <Typography>View highest score frame</Typography>
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="primary"
                            onClick={showMinScoreFrames}
                            style={thinButtonSize}>
                        <Typography>View lowest score frame</Typography>
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="primary"
                            onClick={showGraph}
                            style={thinButtonSize}>
                        <Typography>View score graph</Typography>
                    </Button>
                </Grid>
            </Grid>
        )
    }


    const ComputeVmafUI = () => {
        return (
            <>
                {<DisplayArea/>}
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
                <Grid container spacing={1} paddingTop={2} justifyContent="center" direction="column"
                      alignItems="center">
                    <Grid item xs={4}>
                        <VmafModelSelect/>
                    </Grid>
                    <Grid item xs={4}>
                        {<ComputeOrCancelButton/>}
                    </Grid>
                    <Grid item xs={4}>
                        <AdditionalButtons/>
                    </Grid>
                </Grid>
            </>
        )
    }

    const EncodingLadderComingSoonUI = () => {
        return (
            <Grid container direction="column">
                <Grid item>
                    <Typography variant="h4">Coming Soon!</Typography>
                </Grid>
            </Grid>
        )
    }

    return (<>
        {/*{<SelectStateTabs/>}*/}
        {selectedState.computeVmaf ?
            <ComputeVmafUI/>
                : <EncodingLadderComingSoonUI/>}
        </>
    )
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

    const heroStyle = {
        marginTop: "40px",
        marginBottom: "40px"
    }

    const titleStyle = {
        fontSize: "2.25rem",
        lineHeight: "2.5rem",
        fontWeight: 700,
    }

    const subtitleStyle = {
        fontSize: "1.125rem",
        lineHeight: "1.75rem",
        color: grey[600],
    }

    const featurePointStyle = {
        fontSize: "1.0rem",
        lineHeight: "1.3rem",
        color: grey[600],
    }

    const Footer = () => {
        const footerStyle = {
            marginTop: "calc(5% + 30px)",
            bottom: 0,
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            borderTopColor: grey[200],
            height: "50px"
        }

        return (
            <Grid container alignItems="baseline" style={footerStyle} spacing={2}>
                <Grid item>
                    <Typography variant="subtitle1" color="secondary">© vmaf.web 2022</Typography>
                </Grid>
            </Grid>
        );
    }

    const [contactFormOpen, setContactFormOpen] = useState(false);

    const handleClickOpen = () => {
        setContactFormOpen(true);
    }

    const handleClose = () => {
        setContactFormOpen(false);
    }

    const ContactUsButtonAndForm = () => {
        return (
            <>
                <Button style={buttonStyle} variant="contained" color="primary" onClick={handleClickOpen}>
                    Contact us
                </Button>
                <Dialog open={contactFormOpen} onClose={handleClose}>
                    <DialogTitle>
                        {"We want to hear from you!"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Please email us at <b>contact@vmaf.web</b> with bug reports, feature requests or
                            any comments.
                        </DialogContentText>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    const tabs = (
        <>
            <Typography marginLeft="3px" marginTop="auto" marginRight="auto" color="secondary" style={tabStyle}>
                vmaf.web
            </Typography>
            <div style={tabListStyle}>
                <ContactUsButtonAndForm/>
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

                <Grid container spacing={2} justifyContent="space-around" style={heroStyle}>
                    <Grid item xs={5}>
                        <Grid container direction="column" spacing={2}>
                            <Grid item>
                                <Typography variant="h4" align="left" style={titleStyle}>Measure video quality and make
                                    encoding decisions from your web browser.</Typography>
                            </Grid>
                            <Grid item>
                                <Typography variant="subtitle1" align="left" style={subtitleStyle}>Estimate the optimal
                                    encoding ladder for your videos and compute VMAF scores.
                                    Video encoding tools on browser that work at native app speeds. <b>Get started
                                        below.</b></Typography>
                            </Grid>
                            <Grid item>
                                <Grid container spacing={2}>
                                    {/*<Grid item>*/}
                                    {/*    <Button color="secondary" variant="contained">*/}
                                    {/*        Get Started*/}
                                    {/*    </Button>*/}
                                    {/*</Grid>*/}
                                    {/*<Grid item>*/}
                                    {/*    <Button color="primary" variant="contained">*/}
                                    {/*        Learn more*/}
                                    {/*    </Button>*/}
                                    {/*</Grid>*/}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={5} marginTop="1em">
                        <Typography variant="h6" color="textPrimary" align="left">
                            <CheckCircleIcon color="secondary" fontSize="small"/>
                            &nbsp;Entirely on browser
                        </Typography>
                        <Typography style={featurePointStyle} align="left">
                            Everything happens on your browser. No data from your videos is shared with our servers.
                        </Typography>
                        <br></br>
                        <Typography variant="h6" color="textPrimary" align="left">
                            <RocketLaunchIcon color="comingSoon" fontSize="small"/>
                            &nbsp; (coming soon) Near native speeds
                        </Typography>
                        <Typography variant="subtitle1" style={featurePointStyle} align="left">
                            Optimized webassembly makes it possible to run compute at speeds close to a native FFmpeg +
                            VMAF installation.
                        </Typography>
                        <br></br>
                        <Typography variant="h6" color="textPrimary" align="left">
                            <RocketLaunchIcon color="comingSoon" fontSize="small"/>
                            &nbsp; (coming soon) Content-aware encoding ladder
                        </Typography>
                        <Typography variant="subtitle1" style={featurePointStyle} align="left">
                            Uses machine learning to quickly determine the optimal bitrate for each video and
                            resolution.
                            No need to do test encodes.
                        </Typography>
                    </Grid>
                </Grid>

                <Grid container style={innerContainerStyle} direction="column" justifyContent="center"
                      alignItems="center">
                    <Inputs/>
                </Grid>
                <Footer/>
            </Container>
        </ThemeProvider>
    );
}