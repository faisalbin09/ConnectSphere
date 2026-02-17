import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(false);

    let [audio, setAudio] = useState(false);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // Screen share focus mode
    const [focusedStream, setFocusedStream] = useState(null);
    const focusedVideoRef = useRef();

    const chatEndRef = useRef(null);
    const socketConnectedRef = useRef(false);


    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);



    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        const init = async () => {
            await getPermissions();   // ✅ WAIT until permissions finish

            const savedUser = localStorage.getItem("meet_username");
            const joined = localStorage.getItem("meet_joined");

            if (savedUser && joined === "true") {
                setUsername(savedUser);
                setAskForUsername(false);
                getMedia();           // ✅ now media always ready
            }
        };

        init();
    }, []);


    useEffect(() => {
        // Add 2 fake history states (history lock)
        window.history.pushState(null, "", window.location.href);
        window.history.pushState(null, "", window.location.href);

        const cleanupMeeting = () => {
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => track.stop());
                }

                for (let id in connections) {
                    connections[id].close();
                    delete connections[id];
                }

                if (socketRef.current) socketRef.current.disconnect();
            } catch (e) { }
        };

        const redirectUser = () => {
            const token = localStorage.getItem("token");
            window.location.replace(token ? "/home" : "/");
        };

        const handleBackButton = () => {
            cleanupMeeting();
            redirectUser();
        };

        window.addEventListener("popstate", handleBackButton);

        // Prevent forward navigation back into meeting
        const handlePageShow = (event) => {
            if (event.persisted) {
                cleanupMeeting();
                redirectUser();
            }
        };

        window.addEventListener("pageshow", handlePageShow);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
            window.removeEventListener("pageshow", handlePageShow);
        };
    }, []);

    useEffect(() => {
        if (focusedVideoRef.current && focusedStream) {
            focusedVideoRef.current.srcObject = focusedStream;
        }
    }, [focusedStream]);



    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();

            // ✅ connect socket only once
            if (!socketConnectedRef.current) {
                connectToSocketServer();
                socketConnectedRef.current = true;
            }
        }
    }, [video, audio])


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
    }





    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => {
                connections[id].addTrack(track, window.localStream);
            });


            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                window.localStream.getTracks().forEach(track => {
                    connections[id].addTrack(track, window.localStream);
                });


                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => {
                connections[id].addTrack(track, window.localStream);
            });


            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].ontrack = (event) => {

                        const stream = event.streams[0];

                        let videoExists = videoRef.current.find(v => v.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updated = videos.map(v =>
                                    v.socketId === socketListId ? { ...v, stream } : v
                                );
                                videoRef.current = updated;
                                return updated;
                            });

                        } else {
                            const newVideo = {
                                socketId: socketListId,
                                stream: stream
                            };

                            setVideos(videos => {
                                const updated = [...videos, newVideo];
                                videoRef.current = updated;
                                return updated;
                            });
                        }
                    }



                    // Add the local video stream
                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()

                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    }

                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit(
                                        'signal',
                                        id2,
                                        JSON.stringify({ 'sdp': connections[id2].localDescription })
                                    )
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }

            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        const enabled = !video;
        setVideo(enabled);

        if (window.localStream) {
            window.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    let handleAudio = () => {
        const enabled = !audio;
        setAudio(enabled);

        if (window.localStream) {
            window.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }


    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {

        localStorage.removeItem("meet_username");
        localStorage.removeItem("meet_joined");

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }

            for (let id in connections) {
                connections[id].close();
                delete connections[id];
            }

            if (socketRef.current) socketRef.current.disconnect();
        } catch (e) { }

        const token = localStorage.getItem("token");

        if (token) {
            window.location.replace("/home");
        } else {
            window.location.replace("/");
        }
    }


    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }


    let connect = () => {
        if (!username.trim()) return;

        socketConnectedRef.current = false;  // 👈 add this

        localStorage.setItem("meet_username", username);
        localStorage.setItem("meet_joined", "true");

        setAskForUsername(false);
        getMedia();
    }




    return (
        <div>

            {askForUsername === true ?


                <div className={styles.lobbyWrapper}>

                    <div className={styles.lobbyCard}>

                        <h2 className={styles.lobbyTitle}>Enter into Lobby</h2>

                        <TextField
                            label="Enter name to join"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            variant="outlined"
                            className={styles.lobbyInput}
                        />


                        <Button
                            variant="contained"
                            onClick={connect}
                            className={styles.lobbyButton}
                        >
                            Connect
                        </Button>

                        <div className={styles.videoPreview}>
                            <video ref={localVideoref} autoPlay muted />
                        </div>

                    </div>

                </div>
                :


                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <h1>Chat</h1>

                            <div className={styles.chattingDisplay}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}

                                {/* 👇 ADD THIS LINE RIGHT HERE */}
                                <div ref={chatEndRef}></div>

                            </div>

                            <div className={styles.chattingArea}>
                                <TextField
                                    size="small"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    id="outlined-basic"
                                    placeholder="Enter your chat"
                                    variant="outlined"
                                />

                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={sendMessage}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>

                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='orange'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>

                    {/* Screen Share Focus Overlay */}
                    {focusedStream && (
                        <div className={styles.focusOverlay}>
                            <button
                                className={styles.closeFocusBtn}
                                onClick={() => setFocusedStream(null)}
                            >
                                ✕
                            </button>

                            <video
                                ref={focusedVideoRef}
                                autoPlay
                                controls={false}
                            />
                        </div>
                    )}


                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div
                                key={video.socketId}
                                className={styles.participantTile}
                                onClick={() => setFocusedStream(video.stream)}
                            >
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                />
                            </div>
                        ))}
                    </div>


                </div>

            }

        </div>
    )
}
