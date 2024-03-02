import { Container, Row, Col, Card, InputGroup, Form, Nav, Button, Alert, Stack, Badge, Spinner, Image } from "react-bootstrap"
import Peer, { util } from "peerjs"

import type { peer_status, node_gallery_images } from './main'
import { useNavigate, useParams } from "react-router-dom"
import { useCallback, useEffect, useState } from "react"

type Navbar_props = {
    peer: Peer | undefined
    peer_status: peer_status
    set_directory_handler: React.Dispatch<React.SetStateAction<FileSystemDirectoryHandle | undefined>>
    peer_id: string
    node_gallery_images: node_gallery_images
    set_node_gallery_images: React.Dispatch<React.SetStateAction<node_gallery_images>>
}

const Navbar: React.FC<Navbar_props> = ({
    peer_id,
    peer_status,
    peer,
    set_directory_handler,
    node_gallery_images,
    set_node_gallery_images
}) => {

    const [node_id_input, set_node_id_input] = useState('')
    const { node_id } = useParams()

    const navigate = useNavigate()

    const host = useCallback(() => {
        (async () => {
            const handler = await window.showDirectoryPicker({ id: 'serverless', mode: 'read' })
            console.debug(handler, 'handler')
            set_directory_handler(handler)
        })()

        navigate(`/${peer_id}`)

    }, [peer_id])

    useEffect(() => {
        if (!node_id || !peer || peer_status != 'connected' || node_id == peer_id || node_id == '') return

        set_node_gallery_images((ngimgs) => (
            {
                ...ngimgs,
                [node_id_input]: {
                    idx: null,
                    images: {},
                    available: false
                }
            }
        ))

        peer.connect(node_id, {
            metadata: 'serverless-gallery'
        })

    }, [node_id, peer, peer_id, peer_status])

    return (
        <Row>
            <Nav variant="pills" className="d-flex justify-content-center p-1">
                <Nav.Item>
                    <Button onClick={host}
                        disabled={
                            !('showDirectoryPicker' in window) ||
                            !util.supports.data ||
                            !(peer_status == 'connected')
                        }
                        variant="link">Host</Button>
                </Nav.Item>
                <Nav.Item>
                    <InputGroup>
                        <Form.Control
                            disabled={
                                !util.supports.data ||
                                !(peer_status == 'connected')
                            }
                            placeholder={node_id ? node_id : "node id"}
                            onChange={(evt) => {
                                set_node_id_input(evt.target.value)
                            }}
                        ></Form.Control>
                        <Button variant="outline-secondary"
                            disabled={
                                !util.supports.data ||
                                !(peer_status == 'connected')
                            }
                            onClick={() => {
                                navigate(`/${node_id_input}`)
                            }}
                        >🚀</Button>
                    </InputGroup>
                </Nav.Item>
                <Nav.Item>
                    <Button variant="outline-secondary"
                        disabled={!util.supports.data || peer_status != 'connected'}
                        onClick={() => {
                            navigate(`/${peer_id}`)
                        }}
                    >🏠</Button>
                </Nav.Item>
            </Nav>
        </Row>
    )
}

export default Navbar 