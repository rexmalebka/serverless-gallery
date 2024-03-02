import { useState, useCallback, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap"
import InfiniteScroll from "react-infinite-scroller"
import type { gallery_images, node_gallery_images, peer_status } from './main'
import Peer from "peerjs"
import { useNavigate, useParams } from "react-router-dom"

type Gallery_props = {
    host_images: gallery_images
    peer: Peer | undefined
    peer_status: peer_status
    peer_id: string
    node_gallery_images: node_gallery_images
}



const Gallery: React.FC<Gallery_props> = ({ node_gallery_images, peer, peer_status, peer_id, host_images }) => {
    const [images, set_images] = useState<string[]>([])
    const [page, set_page] = useState(0)

    const { node_id } = useParams()

    const navigate = useNavigate()

    useEffect(() => {
        if (!peer) return
        if (peer_id == node_id) {
            set_images(Object.values(host_images))
        }

    }, [peer, node_id, host_images, peer_id])

    useEffect(() => {
        set_page(0)
    }, [node_id])

    const load_host_images = useCallback((page: number) => {
        set_images(Object.values(host_images).slice(0, page * 4))
        set_page(p => p + 1)
        console.debug('load host')
    }, [host_images])


    const cut_chunks = useCallback((image_list: string[]) => {
        const new_image_list = []

        for (let i = 0; i < image_list.length; i += 4) {
            const chunk = image_list.slice(i, i + 4);
            // do whatever
            new_image_list.push(chunk)
        }

        return new_image_list
    }, [])

    return (
        <Container>
            {
                (images.length == 0) ? (
                    <Row>
                        <Col>
                            <Alert variant="secondary" className="w-50 mx-auto">
                                <div>
                                    {node_id == peer_id ? ("you are not serving any image") : "this peer is not serving any image"}
                                </div>
                            </Alert>
                        </Col>
                    </Row>
                ) : null
            }
            {
                JSON.stringify(node_gallery_images)
            }
            {
                (node_gallery_images[node_id || ''] && node_id != peer_id && !node_gallery_images[node_id || ''].available) ? (
                    <Row>
                        <Col>
                            <Alert variant="secondary" className="w-50 mx-auto">
                                <div>
                                    peer is unavailable, refresh to connect again or <Alert.Link
                                        onClick={() => {
                                            navigate(`/${peer_id}`)
                                        }}
                                    >go home</Alert.Link>
                                </div>
                            </Alert>
                        </Col>
                    </Row>
                ) : (
                    <InfiniteScroll
                        maxLength={images.length}
                        pageStart={0}
                        hasMore={!(page <= (images.length / 4))}
                        loadMore={node_id == peer_id ? load_host_images : () => { }}
                        useWindow={false}
                    >
                        {
                            cut_chunks(images).map((chunk) => (
                                <Row>
                                    {
                                        chunk.map((image_url) => (
                                            <Col md={3} className="h-50">
                                                <Card>
                                                    <Card.Img loading="lazy" src={image_url}></Card.Img>
                                                </Card>
                                            </Col>
                                        ))
                                    }
                                </Row>
                            ))
                        }
                    </InfiniteScroll>
                )
            }

        </Container >
    )
}

// const Gallery: React.FC<{ image_urls: string[][] }> = ({ image_urls }) => {

//     const [imgs, set_imgs] = useState<string[][]>([])

//     const [page, set_page] = useState(0) 
//     useEffect(() => {
//         console.debug("gallery", image_urls, imgs)
//     })


//     const load_more = useCallback((page: number) => {
//         console.debug("load more uwu", page)
//         const selected_imgs = image_urls.slice(0, page)
//         set_imgs(i => selected_imgs)
//         set_page(i => i+1)

//     }, [image_urls, imgs])

//     return (
//         <Container >
//             <InfiniteScroll
//                 maxLength={image_urls.length}
//                 pageStart={0}
//                 hasMore={!(page == image_urls.length)}
//                 loadMore={load_more}
//                 useWindow={false}

//             >
//                 {
//                     imgs.map((chunks) => (
//                         <Row>
//                             {
//                                 chunks.map((img_url) => (
//                                     <Col md={3} className="h-50">
//                                         <Card>
//                                             <Card.Img loading="lazy" src={img_url}></Card.Img>
//                                         </Card>
//                                     </Col>
//                                 ))
//                             }
//                         </Row>
//                     ))
//                 }

//             </InfiniteScroll>
//         </Container>
//     )
// }

export default Gallery