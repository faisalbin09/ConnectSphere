import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const defaultTheme = createTheme();

export default function Authentication() {

    const navigate = useNavigate();

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [confirmPassword, setConfirmPassword] = React.useState("");


    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const getPasswordChecks = (pwd) => ({
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        digit: /\d/.test(pwd),
        special: /[@$!%*?&#^()_\-+=]/.test(pwd)
    });

    const passwordChecks = getPasswordChecks(password);


    const isValidPassword = (pwd) => {
        const c = getPasswordChecks(pwd);
        return c.length && c.uppercase && c.digit && c.special;
    };


    const handleAuth = async () => {
        try {

            // LOGIN
            if (formState === 0) {
                await handleLogin(username, password);
                return;
            }

            // SIGNUP
            if (formState === 1) {

                // basic checks
                if (!name || !username || !password || !confirmPassword) {
                    setError("All fields are required");
                    return;
                }

                // password strength check
                if (!isValidPassword(password)) {
                    setError(
                        "Password must be 8+ chars with uppercase, number & special character"
                    );
                    return;
                }

                // confirm password check
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    return;
                }

                // ✅ only now call register
                const result = await handleRegister(name, username, password);

                // reset
                setUsername("");
                setPassword("");
                setConfirmPassword("");
                setName("");
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
            }

        } catch (err) {
            const msg = err?.response?.data?.message || "Auth failed";
            setError(msg);
        }
    };


    const inputSX = {
        "& .MuiOutlinedInput-input": { color: "white" },
        "& .MuiInputLabel-root": { color: "#cbd5f1" },
        "& .MuiInputLabel-root.Mui-focused": { color: "#756bf5" },
        "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            "& fieldset": { borderColor: "#475569" },
            "&:hover fieldset": { borderColor: "#64748b" },
            "&.Mui-focused fieldset": {
                borderColor: "#756bf5",
                borderWidth: "2px"
            }
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />

                {/* Left Image */}
                <Grid
                    item xs={false} sm={4} md={7}
                    sx={{
                        backgroundImage:
                            'url(https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1170&auto=format&fit=crop)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Right Panel */}
                <Grid
                    item xs={12} sm={8} md={5}
                    component={Paper}
                    elevation={8}
                    square
                    sx={{
                        background: "#020617",
                        color: "white"
                    }}
                >
                    <Box
                        sx={{
                            my: 6,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >

                        {/* Home Logo */}
                        <Typography
                            onClick={() => navigate("/")}
                            sx={{
                                fontWeight: 800,
                                fontSize: 22,
                                mb: 2,
                                cursor: "pointer",
                                letterSpacing: 1,
                                color: "#756bf5"
                            }}
                        >
                            Zebster's Zoom Call
                        </Typography>

                        <Avatar sx={{ m: 1, bgcolor: "#756bf5" }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        <Typography variant="h5" sx={{ mb: 2 }}>
                            {formState === 0 ? "Sign In" : "Create Account"}
                        </Typography>

                        {/* Toggle Buttons */}
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <Button
                                variant={formState === 0 ? "contained" : "outlined"}
                                onClick={() => setFormState(0)}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant={formState === 1 ? "contained" : "outlined"}
                                onClick={() => setFormState(1)}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        <Box
                            component="form"
                            noValidate
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAuth();
                            }}
                            sx={{ width: "100%" }}
                        >


                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    sx={inputSX}
                                />
                            )}

                            <TextField
                                margin="normal"
                                fullWidth
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                sx={inputSX}
                            />

                            <TextField
                                margin="normal"
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={inputSX}
                            />

                            {/* ✅ LIVE PASSWORD RULE CHECK */}
                            {formState === 1 && password && (
                                <Box sx={{ mt: 1, fontSize: 13 }}>

                                    <Typography sx={{ color: passwordChecks.length ? "#22c55e" : "#ef4444" }}>
                                        {passwordChecks.length ? "✓" : "✗"} At least 8 characters
                                    </Typography>

                                    <Typography sx={{ color: passwordChecks.uppercase ? "#22c55e" : "#ef4444" }}>
                                        {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
                                    </Typography>

                                    <Typography sx={{ color: passwordChecks.digit ? "#22c55e" : "#ef4444" }}>
                                        {passwordChecks.digit ? "✓" : "✗"} One number
                                    </Typography>

                                    <Typography sx={{ color: passwordChecks.special ? "#22c55e" : "#ef4444" }}>
                                        {passwordChecks.special ? "✓" : "✗"} One special character
                                    </Typography>

                                </Box>
                            )}

                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Confirm Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    sx={inputSX}
                                />
                            )}

                            {formState === 1 && confirmPassword && (
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: confirmPassword === password ? "#22c55e" : "#ef4444"
                                    }}
                                >
                                    {confirmPassword === password ? "✓ Passwords match" : "✗ Passwords do not match"}
                                </Typography>
                            )}




                            {error && (
                                <Typography sx={{ color: "#ef4444", mt: 1 }}>
                                    {error}
                                </Typography>
                            )}

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={
                                    formState === 1 &&
                                    (!isValidPassword(password) || password !== confirmPassword)
                                }
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    background: "#756bf5",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: "10px",
                                    "&:hover": {
                                        background: "#5b52d6"
                                    }
                                }}
                            >


                                {formState === 0 ? "Login" : "Register"}
                            </Button>

                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
            />
        </ThemeProvider>
    );
}
