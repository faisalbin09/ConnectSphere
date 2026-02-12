import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';
import styles from "../styles/home.module.css"

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const { addToUserHistory } = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>

            <div className={styles.navBar}>


                <div style={{ display: "flex", alignItems: "center" }}>

                    <h2>Zebster's Video Call</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                    <Button
                        startIcon={<RestoreIcon />}
                        onClick={() => navigate("/history")}
                    >
                        History
                    </Button>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>

                </div>



            </div>


            <div className={styles.meetContainer}>

                <div className={styles.leftPanel}>

                    <div>
                        <h2>Providing Quality Video Call </h2>

                        <div style={{ display: 'flex', gap: "10px" }}>

                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                label="Meeting Code"
                                variant="outlined"
                                sx={{
                                    minWidth: "260px",

                                    /* input text */
                                    "& .MuiOutlinedInput-input": {
                                        color: "white"
                                    },

                                    /* root input box */
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",

                                        "& fieldset": {
                                            borderColor: "#6b7280"
                                        },

                                        "&:hover fieldset": {
                                            borderColor: "#9ca3af"
                                        },

                                        "&.Mui-focused fieldset": {
                                            borderColor: "#756bf5",
                                            borderWidth: "2px"
                                        }
                                    },

                                    /* label normal */
                                    "& .MuiInputLabel-root": {
                                        color: "#e5e7eb"
                                    },

                                    /* label floating (focused) */
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "#ffffff"
                                    }
                                }}
                            />



                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>

                        </div>
                    </div>
                </div>
                <div className={styles.rightPanel}>

                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>
        </>
    )
}


export default withAuth(HomeComponent)