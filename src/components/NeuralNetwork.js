import { Cloud, Line, MapControls, OrbitControls, Points, Sky, Sparkles, Stars } from '@react-three/drei'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import InputLayer from './InputLayer'
import HiddenLayerOne from './HiddenLayerOne'
import HiddenLayerTwo from './HiddenLayerTwo'
import OutputLayer from './OutputLayer'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MnistData } from '../ML Files/mnist_data'
import * as tf from '@tensorflow/tfjs';
import { Segments, Segment, Trail, useTrail } from '@react-three/drei';



export const NeuralNetworkContext = React.createContext()

function NeuralNetwork() {

        // refs
        const inputLayerRef = React.createRef();
        const hiddenLayerOneRef = useRef();
        const hiddenLayerTwoRef = useRef();
        const outputLayerRef = useRef();


       
        const [rotationEnabled, toggleRotation] = useState(true)

        const [visualizationState, togglePretrainedVisualization] = useState(false)
        const [animateLines, setAnimateLines] = useState(false)
        const [worker, setWorker] = useState(new Worker(new URL('../workers/worker.js', import.meta.url)))
        
        // an array of 20 color InstancedBufferAttributes
        const [colorAttributesArray, setColorAttributesArray] = useState([])


        // memoize positions for each neuron in each layer
        const inputLayerPositions = useMemo(() => {
                const positions = []
                for(let row = -210; row < 210; row+=15) {
                        for(let col = -210; col < 210; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, []);

        const layerOnePositions = useMemo(() => {
                const positions = []
                for(let row = -30; row < 30; row+=15) {
                        for(let col = -30; col < 30; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, []);

        const layerTwoPositions = useMemo(() => {
                const positions = []
                for(let row = -30; row < 30; row+=15) {
                        for(let col = -30; col < 30; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, []);

        const outputLayerPositions = useMemo(() => {
                const positions = []
                for(let row = -75; row <= 75; row+=15) {
                        positions.push(new THREE.Vector3(row, -1, 0))

                }
                return positions
        }, [])

	// Memoize the results of expensive functions
	const networkMeshes = useMemo(initializeNeuralNetworkMesh, []);
	const connectionVertices = useMemo(getConnectionVertices, []);
      


        const [neuralNetwork, setNeuralNetwork] = useState({
		networkMeshes,
		connectionVertices
        })


        


        // useEffect(() => {
        //         // const worker = new Worker('../workers/worker.js')
        //         if(inputLayerPositions.length > 0){
        //                 loadInitialExamples()
        //         }
        // }, [inputLayerPositions])

        // useEffect(() => {
        //         console.log(inputWeightMesh)
        // }, [inputWeightMesh])

        // useEffect(() => {
        //         worker.onmessage = (e) => {
        //                 console.log('Message received from worker', e.data)
        //                 if(e.data.action == 'drawPredictionInput'){
        //                         const imagePixels = e.data.imagePixels
        //                         let tempColorBuffers = []
        //                         const colorScheme = Float32Array.from(imagePixels)

        //                         const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)

        //                         tempColorBuffers.push(currentColorAttribute)

        //                         setColorAttributesArray(tempColorBuffers)
        //                 }
        //                 if(e.data.action == 'animatePrediction'){
        //                         console.log(e.data)
        //                 }
        //         }
        //         const message = {action: 'initializeNetwork'}
        //         worker.postMessage(message)
        //         return () => {
        //                 console.log('terminating worker')
        //                 worker.terminate()
        //         }

        // }, [])
        
        function initializeNeuralNetworkMesh(){
                //create instance mesh for each layer
                const inputLayerGeometry = new THREE.BoxGeometry(10,10,10)
                const inputLayerMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, vertexColors: true})
                const inputLayerMesh = new THREE.InstancedMesh(inputLayerGeometry, inputLayerMaterial, 784);
                inputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                const layerOneGeometry = new THREE.BoxGeometry(10,10,10)
                const layerOneMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color:'red'})
                const layerOneMesh = new THREE.InstancedMesh(layerOneGeometry, layerOneMaterial, 16);
                layerOneMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                const layerTwoGeometry = new THREE.BoxGeometry(10,10,10)
                const layerTwoMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color:'hotpink'})
                const layerTwoMesh = new THREE.InstancedMesh(layerTwoGeometry, layerTwoMaterial, 16);
                layerTwoMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                const outputLayerGeometry = new THREE.BoxGeometry(10,10,10)
                const outputLayerMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color:'green'})
                const outputLayerMesh = new THREE.InstancedMesh(outputLayerGeometry, outputLayerMaterial, 10);
		outputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                // create instanced mesh for weight trail objects
                const inputWeightGeometry = new THREE.SphereGeometry( 5, 32, 32 );
                const inputWeightMaterial = new THREE.MeshNormalMaterial();
                const inputWeightMesh = new THREE.InstancedMesh(inputWeightGeometry, inputWeightMaterial, inputLayerMesh.count);
		inputWeightMesh.name = 'inputWeightMesh';

                const layerOneWeightGeometry = new THREE.SphereGeometry( 1, 32, 32 );
                const layerOneWeightMaterial = new THREE.MeshNormalMaterial();
                const layerOneWeightMesh = new THREE.InstancedMesh(layerOneWeightGeometry, layerOneWeightMaterial, layerOneMesh.count);
                layerOneWeightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		layerOneWeightMesh.name = 'layerOneWeightMesh';

                const layerTwoWeightGeometry = new THREE.SphereGeometry( 1, 32, 32 );
                const layerTwoWeightMaterial = new THREE.MeshNormalMaterial();
                const layerTwoWeightMesh = new THREE.InstancedMesh(layerTwoWeightGeometry, layerTwoWeightMaterial, layerTwoMesh.count);
		layerTwoWeightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                // move the neurons in each layer to the correct position
                // TODO move this logic to a function
                // input layer 
                for(let i = 0; i < inputLayerPositions.length;i++){
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(inputLayerPositions[i])
                        inputLayerMesh.setMatrixAt(i,matrix)
                        inputWeightMesh.setMatrixAt(i,matrix)
                }

                // layer one
                for(let i = 0; i < layerOnePositions.length;i++){
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(layerOnePositions[i])
                        layerOneMesh.setMatrixAt(i,matrix)
                        layerOneWeightMesh.setMatrixAt(i,matrix)
                }

                // layer two
                for(let i = 0; i < layerTwoPositions.length;i++){
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(layerTwoPositions[i])
                        layerTwoMesh.setMatrixAt(i,matrix)
                        layerTwoWeightMesh.setMatrixAt(i,matrix)
                }

                // output layer
                for(let i = 0; i < outputLayerPositions.length;i++){
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(outputLayerPositions[i])
                        outputLayerMesh.setMatrixAt(i,matrix)
                }

                return {
                        inputLayerMesh,
                        layerOneMesh,
                        layerTwoMesh,
                        outputLayerMesh,
                        inputWeightMesh,
                        layerOneWeightMesh,
                        layerTwoWeightMesh,
                }

        }

        function getConnectionVertices(){

                const inputToLayerOneVertices = []
                const layerOneToLayerTwoVertices = []
                const layerTwoToOutputVertices = []

                // create weight vertices for input layer to hidden layer one
                for(let i = 0; i < inputLayerPositions.length; i++){
                        for(let j = 0; j < layerOnePositions.length; j++){
                                const startPoint = {x: inputLayerPositions[i].x, y: inputLayerPositions[i].y, z:inputLayerPositions[i].z}
                                const endPoint = {x:layerOnePositions[j].x, y: layerOnePositions[j].y, z: layerOnePositions[j].z}
                                
                                inputToLayerOneVertices.push({startPoint,endPoint})
                        }
                }

                // create weight vertices for hidden layer one to hidden layer two
                for(let i = 0; i < layerOnePositions.length; i++){
                        for(let j = 0; j < layerTwoPositions.length; j++){
                                const startPoint = {x: layerOnePositions[i].x, y: layerOnePositions[i].y, z:layerOnePositions[i].z}
                                const endPoint = {x:layerTwoPositions[j].x, y: layerTwoPositions[j].y, z: layerTwoPositions[j].z}
                                
                                layerOneToLayerTwoVertices.push({startPoint,endPoint})
                        }
                }

                // create weight vertices for hidden layer two to output layer
                for(let i = 0; i < layerTwoPositions.length; i++){
                        for(let j = 0; j < outputLayerPositions.length; j++){
                                const startPoint = {x: layerTwoPositions[i].x, y: layerTwoPositions[i].y, z:layerTwoPositions[i].z}
                                const endPoint = {x:outputLayerPositions[j].x, y: outputLayerPositions[j].y, z: outputLayerPositions[j].z}
                                
                                layerTwoToOutputVertices.push({startPoint,endPoint})
                        }
                }

                return {
                        inputToLayerOneVertices,
                        layerOneToLayerTwoVertices,
                        layerTwoToOutputVertices
                }
        }

        const loadInitialExamples = useCallback( async () => {
                const data = new MnistData()
                await data.load()
                const examples = data.nextTestBatch(20)
                const numExamples = examples.xs.shape[0];

                let tempColorBuffers = []

                for(let i = 0; i < numExamples; i++){
                        // console.log('iteration', i)
                        const imageTensor = tf.tidy(() => {
                                // Reshape the image to 28x28 px
                                return examples.xs
                                  .slice([i, 0], [1, examples.xs.shape[1]])
                                  .reshape([28, 28, 1]);
                        });

                        const pixels = await tf.browser.toPixels(imageTensor)

                        const colorScheme = Float32Array.from(pixels)

                        const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)
                        tempColorBuffers.push(currentColorAttribute)
                        
                }
                setColorAttributesArray(tempColorBuffers)

        },[])

        function visualizePretrainedModel(){
                // toggleShowCasing(true)
                togglePretrainedVisualization(!visualizationState)
        }
        const updateVisualizationState = useCallback(() => {
                // toggleShowCasing(newState)
                worker.postMessage({action: 'printGlobals'})
                togglePretrainedVisualization(!visualizationState)
        },[])

        function toggleWorldSetup(){

        }

        function trainNetwork(){
                worker.postMessage({action: 'trainNetwork'})
        }

        // this function is called when the user clicks the predict button
        // it randomly selects a test example, draws it on our inputLayer and predicts the number
        function predictInput(){
                // console.log('predicting input')
                worker.postMessage({action: 'predictInput'})
                updateVisualizationState()
                // loadXExamples()
        }

        function toggleLineAnimation(){
                setAnimateLines(!animateLines)
        }

	// TODO rename this function
        function forwardPass(action){
                // define a target position for the instances
                
		if(action == 'pass-input-to-one'){

			// temporarily hardcoded targetPosition
			const targetPosition = new THREE.Vector3(0,-150,0)

			for(let i = 0; i < 784; i++){
				// variables to store the current values of the trail object
				const currentMatrix = new THREE.Matrix4()
				const currentPosition = new THREE.Vector3()

				// get the instanceMatrix of the trail object
				neuralNetwork.networkMeshes.inputWeightMesh.getMatrixAt(i,currentMatrix)

				// get the current position from the instanceMatrix
				currentPosition.setFromMatrixPosition(currentMatrix)

				const dx = targetPosition.x - currentPosition.x;
				const dy = targetPosition.y - currentPosition.y;
				const dz = targetPosition.z - currentPosition.z;

				const speed = 0.01; // Adjust the speed of animation as needed


				const x = currentPosition.x + dx * speed;
				const y = currentPosition.y + dy * speed;
				const z = currentPosition.z + dz * speed;

				const matrix = new THREE.Matrix4()
				matrix.setPosition(new THREE.Vector3(x,y,z))
				neuralNetwork.networkMeshes.inputWeightMesh.setMatrixAt(i,matrix)
				neuralNetwork.networkMeshes.inputWeightMesh.instanceMatrix.needsUpdate = true;
			}
		}
		else if(action == 'pass-one-to-two'){
		}
		else if(action == 'pass-two-to-output'){
		}

        }

	useFrame(({ clock }) => {
                const time = clock.elapsedTime
                forwardPass('pass-input-to-one')
                
        })

        return (
                <>
                        <group  position={[0,0,100]} rotation={[Math.PI /2, 0, 0]}  >
				<primitive ref = {inputLayerRef} object={neuralNetwork.networkMeshes.inputLayerMesh}/>
				<primitive object={neuralNetwork.networkMeshes.inputWeightMesh} />
				<Segments 
					limit={neuralNetwork.connectionVertices.inputToLayerOneVertices.length} lineWidth={0.01}>
						{neuralNetwork.connectionVertices.inputToLayerOneVertices.map((line, i) => (
                                                        <Segment key={i} 
                                                                // ref={(r) => (lineRef.current[i] = r)} 
                                                                color={'#396e04'} 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-150,line.endPoint.z]}
                                                        />
                                                ))}
                                </Segments>

                        </group>
                        <group  position={[0,0,-50]} rotation={[Math.PI /2, 0, 0]} >
				{/* <primitive ref = {hiddenLayerOneRef} object={neuralNetwork.networkMeshes.layerOneMesh}/> */}
				<primitive object={neuralNetwork.networkMeshes.layerOneWeightMesh} />
				<Segments 
					limit={neuralNetwork.connectionVertices.layerOneToLayerTwoVertices.length} lineWidth={0.1}>
						{neuralNetwork.connectionVertices.layerOneToLayerTwoVertices.map((line, i) => (
                                                        <Segment key={i} 
                                                                // ref={(r) => (lineRef.current[i] = r)} 
                                                                color={'#396e04'} 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-150,line.endPoint.z]}
                                                        />
                                                ))}
                                </Segments>
                        </group>
                        
                        <group position={[0,0,-200]} rotation={[Math.PI /2, 0, 0]} >
				{/* <primitive ref={hiddenLayerTwoRef} object={neuralNetwork.networkMeshes.layerTwoMesh}/> */}
				<primitive object={neuralNetwork.networkMeshes.layerTwoWeightMesh} />
				<Segments 
					limit={neuralNetwork.connectionVertices.layerTwoToOutputVertices.length} lineWidth={1}>
						{neuralNetwork.connectionVertices.layerTwoToOutputVertices.map((line, i) => (
                                                        <Segment key={i} 
                                                                // ref={(r) => (lineRef.current[i] = r)} 
                                                                color={'blue'} 
                                                                start={[line.startPoint.x,line.startPoint.y,line.startPoint.z]} 
                                                                end={[line.endPoint.x,line.endPoint.y-150,line.endPoint.z]}
                                                        />
                                                ))}
                                </Segments>
                        </group>
                        <group position={[0,0,-350]} rotation={[Math.PI /2, 0, 0]} >
				<primitive ref={outputLayerRef} object={neuralNetwork.networkMeshes.outputLayerMesh}/>
                        </group> 
                        <OrbitControls enableRotate={rotationEnabled}/>
                        <Stars count={100000} depth={400}/>
                        <axesHelper/>
                </>
        )
}

export default NeuralNetwork