import Peer from "peerjs"
import { Container, Row, Col, Card, InputGroup, Form, Nav, Button, Alert, Stack, Badge, Spinner, Image } from "react-bootstrap"
import { useParams } from "react-router-dom"
import { util } from "peerjs"

import type { peer_status } from './main'

type Notifications_props = {
    peer: Peer | undefined
    peer_status: peer_status,
    peer_id: string
    directory_handler: FileSystemDirectoryHandle | undefined
}

const Notifications: React.FC<Notifications_props> = ({
    peer,
    peer_status,
    peer_id,
    directory_handler
}) => {

    return (
        <Row>
            <Alert variant="secondary" className="w-50 mx-auto">
                <Alert.Heading>serverless gallery</Alert.Heading>
                {
                    peer ? (
                        <div>
                            <Badge bg={peer_status == 'connected' ? 'success' : 'danger'}>{peer_status}</Badge>
                        </div>
                    ) : null
                }
                {
                    !('showDirectoryPicker' in window) ? (
                        <div>
                            File system API is not supported in this browser, you can't host 😿
                        </div>
                    ) : (
                        directory_handler ? (
                            <div>
                                Serving <i>{directory_handler.name}</i> directory
                            </div>
                        ) : null
                    )

                }
                {
                    !util.supports.data ? (
                        <div>
                            Data channels are not supported in this browser 😿
                        </div>
                    ) : null
                }
                {
                    peer && peer_status == 'connecting' ? (
                        <>
                            Loading... <Spinner animation='border' size="sm"></Spinner>
                        </>
                    ) : null
                }
                {
                    peer ? (
                        <div>
                            your id is: <Alert.Link onClick={() => {
                                navigator.clipboard.writeText(peer_id)
                            }}> {peer_id}</Alert.Link>
                        </div>
                    ) : null
                }

            </Alert>
        </Row >
    )
}

export default Notifications