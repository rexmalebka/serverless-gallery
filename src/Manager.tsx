import { useContext, useCallback, useState, useEffect, Suspense } from "react"
import { ServerlessContext } from './main'

import { Container, Row, Col, Card, InputGroup, Form, Nav, Button, Alert, Stack, Badge, Spinner, Image } from "react-bootstrap"
import Peer, { util } from "peerjs"

import { useNavigate, useParams } from "react-router-dom"
import InfiniteScroll from 'react-infinite-scroller'

const image_regex = /\.(jpg|jpeg|png|gif|bmp)$/
import Gallery from "./Gallery"


const slice_chunks = (array: any[]) => {
    const chunks = []
    for (let i = 0; i < array.length; i += 4) {
        const chunk = array.slice(i, i + 4);
        chunks.push(chunk)
    }
    return chunks
}

const Manager: React.FC = () => {
    const {
        directory_handler,
        set_directory_handler,
        peer,
        set_peer
    } = useContext(ServerlessContext)

    const params = useParams()
    const navigate = useNavigate()

    const [peer_id, set_peer_id] = useState<string>('')
    const [peer_status, set_peer_status] = useState<string>('connecting')

    const [images_handlers, set_images_handlers] = useState<FileSystemFileHandle[]>([])
    const [images_blobs, set_images_blobs] = useState<{ [name: string]: string }>({})

    const [refresh_id, set_refresh_id] = useState<ReturnType<typeof setInterval>>()

    useEffect(() => {
        images_handlers.map((file_handler) => {
            if (!images_blobs[file_handler.name]) {
                file_handler.getFile().then((file_image) => {
                    const url = URL.createObjectURL(file_image)
                    set_images_blobs(imgs => ({ ...imgs, [file_handler.name]: url }))
                })
            }
        })
    }, [images_handlers])

    const host = useCallback(() => {
        (async () => {
            const handler = await window.showDirectoryPicker({ id: 'serverless', mode: 'readwrite' })
            set_directory_handler(handler)


            set_images_handlers([])
            set_images_blobs({})

            clearInterval(refresh_id)
            set_refresh_id(setInterval(() => {
                (async () => {
                    const file_handlers: FileSystemFileHandle[] = []
                    for await (let file of handler.values()) {
                        if (file.kind == 'file' && image_regex.test(file.name.toLowerCase())) {
                            file_handlers.push(file)
                        }
                    }

                    set_images_handlers(file_handlers)
                })()

            }, 1000))


            if (!peer) {
                const p = new Peer()
                set_peer(p)

                p.on('open', (id) => {
                    set_peer_id(id)
                    set_peer_status('connected')
                    navigate(`/${id}`)
                })

                p.on('close', () => {
                    set_peer_status('disconnected')
                })

                p.on('error', (err) => {
                    set_peer_status(err.type)
                })
            }

        })()
    }, [directory_handler, set_directory_handler, peer])

    return (

        <Container style={{ height: '100vh' }} fluid data-bs-theme="dark" h-100 className="bg-dark">
            <Row>
                <Nav variant="pills" className="d-flex justify-content-center p-3">
                    <Nav.Item>
                        <Button onClick={host} disabled={!('showDirectoryPicker' in window) || !util.supports.data} variant="link">Host</Button>
                    </Nav.Item>
                    <Nav.Item>
                        <InputGroup>
                            <Form.Control disabled={!util.supports.data || peer_status != 'connected'} placeholder={params.node_id ? params.node_id : "node id"}></Form.Control>
                            <Button variant="outline-secondary" disabled={!util.supports.data || peer_status != 'connected'}>🌐</Button>
                        </InputGroup>
                    </Nav.Item>
                </Nav>
            </Row>
            <Row>
                <Stack gap={0}>
                    {peer && directory_handler ? (
                        <Alert className="w-50 mx-auto" variant="secondary">
                            <Badge bg={peer_status == 'connected' ? 'success' : 'danger'}>{peer_status}</Badge> {peer_status == 'connected' ? (
                                <>
                                    serving on <Alert.Link onClick={() => navigate(`/${peer_id}`)}>{peer_id}</Alert.Link>
                                </>
                            ) : (
                                peer_status == 'connecting' ? (
                                    <>
                                        loading <Spinner animation='border' size="sm"></Spinner>
                                    </>

                                ) : (
                                    'something happened! 💥'
                                )
                            )
                            }
                        </Alert>
                    ) : null
                    }
                    {
                        !('showDirectoryPicker' in window) ? (
                            <Alert className="w-50 mx-auto" variant="secondary">
                                File system API is not supported in this browser, you can't host 😿
                            </Alert>
                        ) : null
                    }
                    {
                        !util.supports.data ? (
                            <Alert className="w-50 mx-auto" variant="secondary">
                                Data channels are not supported in this browser 😿
                            </Alert>
                        ) : null
                    }
                </Stack>
            </Row>
            <Row className="d-flex h-75 overflow-y-scroll">
                <Gallery image_urls={slice_chunks(Object.values(images_blobs))}></Gallery>
            </Row >
        </Container >
    )
}

export default Manager