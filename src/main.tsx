
import { render } from "react-dom";
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { createContext, useState, useEffect, useCallback } from "react";
import * as React from 'react'

import 'bootstrap/dist/css/bootstrap.min.css';
import Peer, { DataConnection } from "peerjs";

import { Container, Row, Col, Card, InputGroup, Form, Nav, Button, Alert, Stack, Badge, Spinner, Image } from "react-bootstrap"

import './style.css'

import Notifications from "./Notifications";
import Navbar from "./Navbar";
import InfiniteScroll from "react-infinite-scroller";
import Gallery from "./Gallery";

const image_regex = /\.(jpg|jpeg|png|gif|bmp)$/

export type serverless_messages = (
    ['list-images', string[]] |
    ['get-immages', number] |
    ['send-images', Blob[]]
)

export type fatal_errors = (
    'browser-incompatible' |
    "invalid-id" |
    "invalid-key" |
    "ssl-unavailable" |
    "server-error" |
    "socket-error" |
    "socket-closed"
)

export type non_fatal_errors = (
    "disconnected" |
    "network" |
    "unavailable-id" |
    "webrtc"
)

export type peer_status = (
    fatal_errors | non_fatal_errors |
    "connecting" | "connected"
)

export type gallery_images = {
    [name: string]: string
}

export type node_gallery_images = {
    [name: string]: {
        idx: ReturnType<typeof setInterval> | null,
        images: {
            [image_name: string]: string // image url from blob
        }
        available: boolean
    }
}

const Board: React.FC = () => {
    const [peer, set_peer] = useState<Peer>()
    const [peer_id, set_peer_id] = useState('')
    const [peer_status, set_peer_status] = useState<peer_status>('connecting')
    const [directory_handler, set_directory_handler] = useState<FileSystemDirectoryHandle>()
    const [directory_watcher, set_directory_watcher] = useState<ReturnType<typeof setInterval>>()

    const [host_images, set_host_images] = useState<gallery_images>({})
    const [node_gallery_images, set_node_gallery_images] = useState<node_gallery_images>({})

    const handle_peer_data = useCallback((conn: DataConnection, data: unknown) => {
        const [cmd, args] = data as serverless_messages

        console.debug("message coming from ", conn.peer, data
        )
        if (cmd == 'list-images' && node_gallery_images[conn.peer]) {
            // images incoming
            set_node_gallery_images((ngimgs) => (
                {
                    ...ngimgs,
                    [conn.peer]: {
                        idx: null,
                        images: Object.fromEntries(args.map(x => [x, ''])),
                        available: true
                    }
                }
            ))
        }
    }, [node_gallery_images])

    const set_peer_availability = useCallback((id: string) => {
        set_node_gallery_images((ngimgs) => {
            console.debug("asdfsdf", id, ngimgs)
            if (!ngimgs[id]) return ngimgs

            return {
                ...ngimgs,
                [id]: {
                    ...ngimgs[id],
                    available: false
                }
            }
        }
        )
        console.debug(node_gallery_images)
    }, [node_gallery_images])


    useEffect(() => {
        if (peer) return

        const p = new Peer({ debug: 1 })
        set_peer(p)

        p.on('connection', (conn) => {
            console.debug("connection", conn.peer, conn.metadata)
            if (conn.metadata != 'serverless-gallery') {
                conn.close()
                return
            }

            const msg: serverless_messages = ['list-images', Object.keys(host_images)]

            conn.send(msg)

            conn.on('data', (data) => handle_peer_data(conn, data))
        })

        p.on('open', (id) => {
            set_peer_id(id)
            set_peer_status('connected')
        })

        p.on('close', () => {
            set_peer_status('disconnected')
        })

        p.on('error', (err) => {

            if (err.type == 'peer-unavailable') {

                console.info("unavailable", err.message)
                const id = err.message.split(' ').slice(-1)[0]
                set_peer_availability(id)

                return
            }

            set_peer_status(err.type)

            if (['server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
                setTimeout(() => {
                    window.location.reload()
                }, 3000)
            }
        })

    }, [])


    useEffect(() => {
        if (!directory_handler) return

        set_directory_watcher(setInterval(() => {

            (async () => {
                for await (let [filename, file] of directory_handler.entries()) {
                    if (file.kind == 'directory' || !image_regex.test(filename)) continue

                    const url = await file.getFile()
                    set_host_images((images) => {
                        if (images[filename]) return images
                        return {
                            ...images,
                            [filename]: URL.createObjectURL(url)
                        }
                    })

                }
            })()

        }, 1000))

        return () => {
            clearInterval(directory_watcher)
            set_host_images({})
        }

    }, [directory_handler])




    return (
        <Container className="justify-content-center h-100 bg-dark" fluid data-bs-theme="dark">
            <HashRouter>
                <Routes>
                    <Route path="/:node_id?" element={
                        <>
                            <Navbar
                                peer_id={peer_id}
                                peer_status={peer_status}
                                set_directory_handler={set_directory_handler}
                                peer={peer}
                                node_gallery_images={node_gallery_images}
                                set_node_gallery_images={set_node_gallery_images}
                            />
                            <Row className="h-75 overflow-y-scroll">
                                <Gallery peer={peer}
                                    peer_id={peer_id}
                                    peer_status={peer_status}
                                    node_gallery_images={node_gallery_images}
                                    host_images={host_images}
                                />


                            </Row>
                            <Notifications
                                peer={peer}
                                peer_id={peer_id}
                                peer_status={peer_status}
                                directory_handler={directory_handler}
                            />
                        </>
                    } />
                </Routes>
            </HashRouter>
        </Container>
    )

}

render(<Board></Board>, document.querySelector("#app"))