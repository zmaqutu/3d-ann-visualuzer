import React, {useRef, useState, useEffect, useMemo, forwardRef, useContext} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron';
import { Segments, Segment, SegmentObject, Trail, Sphere, useTrail } from '@react-three/drei';
import { NeuralNetworkContext } from './NeuralNetwork';



const InputLayer = forwardRef(function InputLayer(props,inputLayerRef) {
        const nextLayerPositions = props.nextLayerPositions
        const colorAttributesArray = props.inputColorAttributes
        const visualizingModel = props.visualizingModel
        const animateLines = props.animateLines
        let colorIndex = 0

        const {
                setInputPositions,
                setInputWeightMesh
          }  = useContext(NeuralNetworkContext)

        const [linePositions,setLinePositions] = useState([])
        const [lineColor, setLineColor] = useState('blue')
        const lineRef = React.useRef([])
        const sphere = useRef(null)
        const group = useRef(null)
        const trailMeshRef = useRef([])

        const dummyPositions = [ new THREE.Vector3(10,60,100), new THREE.Vector3(40,100,70), new THREE.Vector3(15,12,6)]


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
                        setInputWeightMesh(trailMesh)

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
                // props.passPositionsUp(positions)
                // setInputPositions(positions)
                // setInputWeightMesh(trailMeshRef)
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
                        // inputTrailRef.current[0].position.x = Math.sin(time * 2) * (20 * (i+1))
                        
                }
        }, [animateLines])

        useFrame(({ clock }) => {
                const time = clock.elapsedTime
                forwardPass()
                
        })


        // TODO rename this function
        function forwardPass(){
                // define a target position for the instances
                const targetPoint = new THREE.Vector3(0,-150,0)
                

                // update the position of all the instances
                for(let i = 0; i < 784; i++){
                        // variables to store the current values of the trail object
                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()

                        // get the instanceMatrix of the trail object
                        trailMesh.getMatrixAt(i,currentMatrix)

                        // get the current position from the instanceMatrix
                        currentPosition.setFromMatrixPosition(currentMatrix)


                        const dx = targetPoint.x - currentPosition.x;
                        const dy = targetPoint.y - currentPosition.y;
                        const dz = targetPoint.z - currentPosition.z;

                        const speed = 0.01; // Adjust the speed of animation as needed


                        const x = currentPosition.x + dx * speed;
                        const y = currentPosition.y + dy * speed;
                        const z = currentPosition.z + dz * speed;

                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(new THREE.Vector3(x,y,z))
                        trailMesh.setMatrixAt(i,matrix)
                        trailMesh.instanceMatrix.needsUpdate = true;
                }

        }
        const tempPositions = [new THREE.Vector3(110,-15,100), new THREE.Vector3(-70,-150,30), new THREE.Vector3(0,150,90)]
       
        return (
                <>
                        <primitive ref = {inputLayerRef} object={inputLayerMesh}/>
                        { linePositions.length > 0 
                                ?
                                        <Segments limit={linePositions.length} lineWidth={0.01}>
                                                {linePositions.map((line, i) => (
                                                        <Segment key={i} 
                                                                ref={(r) => (lineRef.current[i] = r)} 
                                                                color={'#396e04'} 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-150,line.endPoint.z]}
                                                        />
                                                ))}
                                        </Segments>
                                : null
                        }
                        {/* {
                                tempPositions.map((cubePosition, i) => (
                                        <Trail
                                                key={i}
                                                width={15}
                                                length={15}
                                                color={'#F8D628'}
                                                attenuation={(t) => {
                                                        return t * t
                                                }}
                                                target={trailMeshRef.current[i]}
                                                decay={0.01}
                                        >
                                                <Sphere visible={true} ref={(r) => (trailMeshRef.current[i] = r)} args={[15, 32, 32]} position={cubePosition}>
                                                        <meshNormalMaterial />
                                                </Sphere>
                                        </Trail>

                                ))
                        } */}
                        <Trail 
                          width={5}
                          length={15}
                          color={'#F8D628'}
                          attenuation={(t) => {
                                return t * t
                          }}
                          target={trailMesh}
                        >
                                <primitive ref = {trailMeshRef} object={trailMesh}/>
                        </Trail>
                </>
        )
})

export default InputLayer