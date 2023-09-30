import React, {useRef, useState, useEffect, useMemo, forwardRef, useContext} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'
import { useThree } from '@react-three/fiber'
import { Segments, Segment, SegmentObject } from '@react-three/drei';
import { NeuralNetworkContext } from './NeuralNetwork';





const HiddenLayerOne = forwardRef(function HiddenLayerOne(props, inputLayerRef) {

       
        const nextLayerPositions = props.nextLayerPositions

        const [linePositions,setLinePositions] = useState([])
        const lineRef = React.useRef([])
        
        const layerOneGeometry = new THREE.BoxGeometry(10,10,10)
        const layerOneMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color:'red'})
        const layerOneMesh = new THREE.InstancedMesh(layerOneGeometry, layerOneMaterial, 16);
        layerOneMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        const { scene, camera, gl } = useThree();

        const [
                setInputPositions, 
                setLayerOnePositions, 
                setLayerTwoPositions, 
                setOutputPositions, 
                inputLayerPositions
        ]  = useContext(NeuralNetworkContext)

        useEffect(() => {
                if(nextLayerPositions.length  > 0){
                        const lines = createLineVertices()
                        setLinePositions(lines)
                }
        }, [nextLayerPositions])
        
        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -30; row < 30; row+=15) {
                        for(let col = -30; col < 30; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                setLayerOnePositions(positions)
                return positions
        }, [])
        for(let i = 0; i < positions.length;i++){
                const matrix = new THREE.Matrix4()
                matrix.setPosition(positions[i])
                layerOneMesh.setMatrixAt(i,matrix)
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
       

        return (
                <>
    		        <primitive object={layerOneMesh} wireframe/>
                        { linePositions.length > 0 
                                ?
                                        <Segments limit={linePositions.length} lineWidth={0.1}>
                                                {linePositions.map((line, i) => (
                                                        <Segment key={i} 
                                                                ref={(r) => (lineRef.current[i] = r)} 
                                                                color={'#396e04'} 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-100,line.endPoint.z]}
                                                        />
                                                ))}
                                        </Segments>
                                : null
                        }
                        {/* {console.log('gl',gl)} */}
                </>
        )
})

export default HiddenLayerOne