import React, {useRef, useState, useEffect, useMemo, forwardRef} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron';
import { Segments, Segment, SegmentObject, Trail, Sphere, useTrail } from '@react-three/drei';



const InputLayer = forwardRef(function InputLayer(props,inputLayerRef) {
        const nextLayerPositions = props.nextLayerPositions
        const colorAttributesArray = props.inputColorAttributes
        const visualizingModel = props.visualizingModel
        const animateLines = props.animateLines
        let colorIndex = 0

        const [linePositions,setLinePositions] = useState([])
        const [lineColor, setLineColor] = useState('blue')
        const lineRef = React.useRef([])
        const sphere = useRef(null)
        const group = useRef(null)
        const inputTrailRef = useRef([])

        // create inputLayer instance mesh
        const inputLayerGeometry = new THREE.BoxGeometry(10,10,10)
        const inputLayerMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, vertexColors: true})
        const inputLayerMesh = new THREE.InstancedMesh(inputLayerGeometry, inputLayerMaterial, 784);
        inputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // create instanced mesh for trail objects
        const trailGeometry = new THREE.SphereGeometry( 5, 32, 32 );
        const trailMaterial = new THREE.MeshNormalMaterial();
        const trailMesh = new THREE.InstancedMesh(trailGeometry, trailMaterial, inputLayerMesh.count);
        trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // create a color buffer attribute for the instanced mesh
        const colorBuffer = new Float32Array(784 * 4);
        const colorAttribute = new THREE.InstancedBufferAttribute(colorBuffer, 4);
        inputLayerGeometry.setAttribute('color', colorAttribute);
        

        useEffect(() => {
		if(nextLayerPositions.length  > 0){
                        const lines = createLineVertices()
                        setLinePositions(lines)
                }
		
        }, [nextLayerPositions])

        useEffect(() => {
		if(props.inputColorAttributes.length == 1){
                        inputLayerMesh.geometry.setAttribute('color', props.inputColorAttributes[colorIndex])
                        inputLayerMesh.geometry.getAttribute('color').needsUpdate = true;
                }
                else if(props.inputColorAttributes.length > 0 && props.visualizingModel){
                        setInterval(() => {
                                inputLayerMesh.geometry.setAttribute('color', props.inputColorAttributes[colorIndex])
                                inputLayerMesh.geometry.getAttribute('color').needsUpdate = true;
                                colorIndex++
                                if(colorIndex >= props.inputColorAttributes.length){
                                        colorIndex = 0
                                }

                        }, 1000);
                }
		
        }, [colorAttributesArray, visualizingModel])


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
                trailMesh.setMatrixAt(i,matrix)
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

        const prevLine = null

        useEffect(() => {
                if(animateLines){
                        lineRef.current.forEach((r, i) => {
                        // const time = clock.elapsedTime
                        r.color.setRGB(1,1,0)
                        })
                }
        }, [animateLines])

        // useFrame(({ clock }) => {
        //         const time = clock.elapsedTime
                
        //         const x = Math.sin(time * 2) * 20
        //         const z = Math.cos(time * 2) * 20
        //         // group.current.rotation.z = time 

        //         // group.current.position.z = Math.tan(time * 2) * 20


        //         const matrix = new THREE.Matrix4()
        //         matrix.setPosition(new THREE.Vector3(x, 0, z))
        //         inputTrailRef.current.setMatrixAt(0,matrix)
        //         trailMesh.setMatrixAt(0,matrix)

        //         // trailMesh.instanceMatrix.array[12] = x;
        //         // trailMesh.instanceMatrix.array[14] = z;
        //         trailMesh.instanceMatrix.needsUpdate = true;


        // })
        console.log(positions)
       
        return (
                <>
                        <primitive ref = {inputLayerRef} object={inputLayerMesh}/>
                        {/* { linePositions.length > 0 
                                ?
                                        <Segments limit={linePositions.length} lineWidth={0.05}>
                                                {linePositions.map((line, i) => (
                                                        <Segment key={i} 
                                                                ref={(r) => (lineRef.current[i] = r)} 
                                                                color={'blue'} 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-150,line.endPoint.z]}
                                                        />
                                                ))}
                                        </Segments>
                                : null
                        } */}
                        
                        <group ref={group}>
                        <Trail 
                          width={15}
                          length={15}
                          color={'#F8D628'}
                          attenuation={(t) => {
                                return t * t
                          }}
                        >
                                {
                                        positions.map((cubePosition, i) => (
                                                <Sphere key={i} ref={(r) => (inputTrailRef.current[i] = r)} args={[15, 32, 32]} position={cubePosition}>
                                                        <meshNormalMaterial />
                                                </Sphere>
                                        ))
                                }
                                {/* <Sphere ref={sphere} args={[5, 32, 32]} position-y={3}>
                                        <meshNormalMaterial />
                                </Sphere> */}
                                {/* <primitive ref = {inputTrailRef} object={trailMesh}/> */}
                        </Trail>
                        </group>
                </>
        )
})

export default InputLayer