import { createTheme } from '@mui/material/styles';
import {grey, red} from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
    palette: {
        primary: {
            main: '#ffffff',
        },
        secondary: {
            main: '#125071',
        },
        textSecondary: {
            main: grey[300],
        },
        error: {
            main: red.A400,
        },
        background: {
            default: "#ffffff",
        },
        typography: {
            fontFamily: "Lato",
            tab: {
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1rem",
            },
            footer: {
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1rem",
            }
        }
    },
});

export default theme;
