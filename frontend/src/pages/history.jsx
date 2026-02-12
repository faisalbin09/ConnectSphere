import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';

import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';

export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history || []);
            } catch (err) {
                console.log(err);
            }
        }

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #020617, #0f172a)",
                padding: { xs: "20px", md: "40px" }
            }}
        >

            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    marginBottom: "30px"
                }}
            >
                <IconButton
                    onClick={() => routeTo("/home")}
                    sx={{
                        background: "#111827",
                        color: "white",
                        "&:hover": { background: "#1f2937" }
                    }}
                >
                    <HomeIcon />
                </IconButton>

                <Typography
                    variant="h5"
                    sx={{ color: "white", fontWeight: 700 }}
                >
                    Meeting History
                </Typography>
            </Box>


            {/* Empty State */}
            {meetings.length === 0 && (
                <Typography sx={{ color: "#9ca3af", marginTop: "40px" }}>
                    No meetings found.
                </Typography>
            )}


            {/* Cards Grid */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "20px"
                }}
            >
                {meetings.map((e, i) => (
                    <Card
                        key={i}
                        sx={{
                            background: "#111827",
                            color: "white",
                            borderRadius: "16px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                            border: "1px solid #1f2937",
                            transition: "0.25s",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            "&:hover": {
                                transform: "translateY(-6px)",
                                boxShadow: "0 14px 30px rgba(0,0,0,0.5)"
                            }
                        }}
                    >

                        <CardContent>

                            <Typography
                                sx={{
                                    fontSize: 13,
                                    color: "#9ca3af",
                                    marginBottom: "6px"
                                }}
                            >
                                Meeting Code
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    marginBottom: "12px",
                                    wordBreak: "break-all"
                                }}
                            >
                                {e.meetingCode}
                            </Typography>

                            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
                                Date
                            </Typography>

                            <Typography sx={{ fontWeight: 600 }}>
                                {formatDate(e.date)}
                            </Typography>

                        </CardContent>


                        <CardActions sx={{ padding: "0 16px 16px" }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => routeTo(`/${e.meetingCode}`)}
                                sx={{
                                    background: "#ef4444",
                                    fontWeight: 600,
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    "&:hover": {
                                        background: "#dc2626"
                                    }
                                }}
                            >
                                Join Again
                            </Button>
                        </CardActions>

                    </Card>
                ))}
            </Box>

        </Box>
    );
}
