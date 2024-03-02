import { useCallback, useEffect, useState } from "react"
import Peer from "peerjs";
import './style.css'

type config_file = {
    id: string

}

const Index: React.FC = () => {
    const [directory_handler, set_directory_handler] = useState<FileSystemDirectoryHandle>()
    const [peer, set_peer] = useState<Peer>()

    const select_root = useCallback(() => {

        (async () => {

            const handler = await window.showDirectoryPicker({ id: 'serverless', mode: 'readwrite' })

            set_directory_handler(handler)


            handler.getFileHandle('')
            /*
            setInterval(async () => {
                for await (let file of handler.entries()) {
                    console.debug('file', file)
                }
            }, 1000)
*/
            const peer = new Peer();
            console.debug('peeer', peer)
            console.debug('handler', handler)

            set_peer(peer);

        })()

    }, [])


    return (
        <div id="main-page">
            <div>
                <h1>serverless host</h1>
            </div>
            <div>


                {'showDirectoryPicker' in window ? (
                    <>
                        {peer ? peer.id : ''}
                        {
                            directory_handler ? 'hosted' : (
                                <button onClick={select_root}>Host</button>
                            )
                        }

                    </>

                ) : (
                    <div>
                        'File system API is not supported in this browser 😿'
                    </div>
                )}

            </div>
        </div>
    )
}

export default Index