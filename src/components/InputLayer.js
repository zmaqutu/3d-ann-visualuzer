import React, {useRef, useState, useEffect, useMemo} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron';
import { Segments, Segment, SegmentObject } from '@react-three/drei';



function InputLayer(props) {
        const nextLayerPositions = props.nextLayerPositions

        const [linePositions,setLinePositions] = useState([])
        const lineRef = React.useRef([])

        // create inputLayer instance mesh
        const inputLayerGeometry = new THREE.BoxGeometry(10,10,10)
        const inputLayerMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color:0x181c20})
        const inputLayerMesh = new THREE.InstancedMesh(inputLayerGeometry, inputLayerMaterial, 784);
        inputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        useEffect(() => {
		if(nextLayerPositions.length  > 0){
                        const lines = createLineVertices()
                        setLinePositions(lines)
                }
		
        }, [nextLayerPositions])

        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -210; row < 210; row+=15) {
                        for(let col = -210; col < 210; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                props.passPositionsUp(positions)
                return positions
        }, [])


        for(let i = 0; i < positions.length;i++){
                const matrix = new THREE.Matrix4()
                matrix.setPosition(positions[i])
                inputLayerMesh.setMatrixAt(i,matrix)
        }


        function createLineVertices(){
                let tempLinePositions = []

                for (let i = 0; i < positions.length; i++) {
                        for (let j = 0; j < props.nextLayerPositions.length; j++) {
                                const startPoint = {x: positions[i].x, y: positions[i].y, z:positions[i].z}
                                const endPoint = {x:props.nextLayerPositions[j].x, y: props.nextLayerPositions[j].y, z: props.nextLayerPositions[j].z}
                                
                                tempLinePositions.push({startPoint,endPoint})
                        }
                }
                return tempLinePositions
        }
        // useFrame(({ clock }) => {
        //             lineRef.current.forEach((r, i) => {
        //               const time = clock.elapsedTime
        //               const x = Math.sin((i / 5000) * Math.PI) * 10
        //               const y = Math.cos((i / 5000) * Math.PI) * 10
        //               const z = Math.cos((i * time) / 1000)
        //               r.start.set(x  , y  , z  )
        //               r.end.set(x + Math.sin(time + i)  , y + Math.cos(time + i)  , z  )
        //               r.color.setRGB(x / 10, y / 10, z)
        //             })
        //           })
       
        return (
                <>
                        <primitive object={inputLayerMesh}/>
                        { linePositions.length > 0 
                                ?
                                        <Segments limit={linePositions.length} lineWidth={0.1}>
                                                {linePositions.map((line, i) => (
                                                        <Segment key={i} 
                                                                ref={(r) => (lineRef.current[i] = r)} 
                                                                color="blue" 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-150,line.endPoint.z]}
                                                        />
                                                ))}
                                        </Segments>
                                : null
                        }
                        {/* <Segments limit={10000} lineWidth={5.0}>
                                {Array.from({ length: 10000 }).map((_, i) => (
                                        <Segment key={i} ref={(r) => (lineRef.current[i] = r)} color="orange" start={[0, 0, 0]} end={[0, 0, 0]} />
                                ))}
                        </Segments> */}
                </>
        )
}

export default InputLayer