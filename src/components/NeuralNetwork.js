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
import { Segments, Segment, Trail, useTrail, Text, Billboard } from '@react-three/drei';
import { useTimer } from 'use-timer';
import { useSpring, animated, a } from '@react-spring/three'




export const NeuralNetworkContext = React.createContext()

function NeuralNetwork(props) {

        // refs
        const inputLayerRef = React.createRef();
        const hiddenLayerOneRef = useRef();
        const hiddenLayerTwoRef = useRef();
        const outputLayerRef = useRef();

        const inputLayerWeightsRef = useRef([])
        const animatedInputWeightsRef = useRef([])

        const hiddenLayerOneWeightsRef = useRef([])
        const animatedHiddenLayerOneWeightsRef = useRef([])

        const hiddenLayerTwoWeightsRef = useRef([])
        const animatedHiddenLayerTwoWeightsRef = useRef([])

        const [active, setActive] = useState(false)

        // state values for layer animation
        let animateInputWeights = props.animateForwardPass
        let animateLayerOneWeights = false
        let animateLayerTwoWeights = false
        let animateOutputLayer = false

        const outputLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        
        let outputLabelPositions = []

        const [rotationEnabled, toggleRotation] = useState(true)

        const [visualizationState, togglePretrainedVisualization] = useState(false)
        const [animateLines, setAnimateLines] = useState(false)
        const [worker, setWorker] = useState(new Worker(new URL('../workers/worker.js', import.meta.url)))

        // an array of 20 color InstancedBufferAttributes
        const [colorAttributesArray, setColorAttributesArray] = useState([])


        // memoize positions for each neuron in each layer
        const inputLayerPositions = useMemo(() => {
                const positions = []
                for (let row = -210; row < 210; row += 15) {
                        for (let col = -210; col < 210; col += 15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, []);

        const layerOnePositions = useMemo(() => {
                const positions = []
                for (let row = -30; row < 30; row += 15) {
                        for (let col = -30; col < 30; col += 15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, []);

        const layerTwoPositions = useMemo(() => {
                const positions = []
                for (let row = -30; row < 30; row += 15) {
                        for (let col = -30; col < 30; col += 15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, []);

        const outputLayerPositions = useMemo(() => {
                const positions = []
                for (let row = -75; row < 75; row += 15) {
                        positions.push(new THREE.Vector3(row, -1, 0))
                        outputLabelPositions.push(new THREE.Vector3(row, 10, 0))

                }
                return positions
        }, [])

        // Memoize the results of expensive functions
        const networkMeshes = useMemo(initializeNeuralNetworkMesh, []);
        const connectionVertices = useMemo(getConnectionVertices, []);



        const [neuralNetwork, setNeuralNetwork] = useState({
                networkMeshes,
                connectionVertices,
                animationPackage: {}		// a package of neural network properties that will be used to animate the network, sent from the worker
        })

        useEffect(() => {
                worker.onmessage = (e) => {
                        console.log('Message received from worker', e.data)
                        if(e.data.action == 'drawPredictionInput'){
                                const inputPixels = e.data.inputPixels
                                let tempColorBuffers = []
                                const colorScheme = Float32Array.from(inputPixels)

                                const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)

                                tempColorBuffers.push(currentColorAttribute)

                                setColorAttributesArray(tempColorBuffers)
                        }
                        if(e.data.action == 'animatePrediction'){
                                console.log(e.data)

                                // the inputLayer pixels
                                const inputPixels = e.data.inputPixels
                        
                                // the predicted output
                                const predictionInstance = e.data.predictionInstance
                                
                                processAnimationPackage(inputPixels, predictionInstance)
                        }
                }
                const message = {action: 'initializeNetwork'}
                worker.postMessage(message)
                return () => {
                        console.log('terminating worker')
                        worker.terminate()
                }

        }, [])

        useEffect(() => {
                if(props.trainNetwork){
                        trainNetwork()
                }
        }, [props.trainNetwork])

        useEffect(() => {
                if(props.predicting){
                        predictInput()
                }
        }, [props.predicting])

        function initializeNeuralNetworkMesh() {
                //create instance mesh for each layer
                const inputLayerGeometry = new THREE.BoxGeometry(10, 10, 10)
                const inputLayerMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true })
                const inputLayerMesh = new THREE.InstancedMesh(inputLayerGeometry, inputLayerMaterial, 784);
                inputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                const layerOneGeometry = new THREE.BoxGeometry(10, 10, 10)
                const layerOneMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'red', vertexColors: true })
                const layerOneMesh = new THREE.InstancedMesh(layerOneGeometry, layerOneMaterial, 16);
                layerOneMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                const layerTwoGeometry = new THREE.BoxGeometry(10, 10, 10)
                const layerTwoMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'hotpink', vertexColors: true })
                const layerTwoMesh = new THREE.InstancedMesh(layerTwoGeometry, layerTwoMaterial, 16);
                layerTwoMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                const outputLayerGeometry = new THREE.BoxGeometry(10, 10, 10)
                const outputLayerMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
                const outputLayerMesh = new THREE.InstancedMesh(outputLayerGeometry, outputLayerMaterial,16);
                outputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                outputLayerMesh.setColorAt(0, new THREE.Color('black'))

                // create instanced mesh for weight trail objects
                const inputWeightGeometry = new THREE.SphereGeometry(2, 32, 32);
                const inputWeightMaterial = new THREE.MeshNormalMaterial();
                const inputWeightMesh = new THREE.InstancedMesh(inputWeightGeometry, inputWeightMaterial, inputLayerMesh.count);
                inputWeightMesh.name = 'inputWeightMesh';

                const layerOneWeightGeometry = new THREE.SphereGeometry(2, 32, 32);
                const layerOneWeightMaterial = new THREE.MeshNormalMaterial();
                const layerOneWeightMesh = new THREE.InstancedMesh(layerOneWeightGeometry, layerOneWeightMaterial, layerOneMesh.count);
                layerOneWeightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                layerOneWeightMesh.name = 'layerOneWeightMesh';

                const layerTwoWeightGeometry = new THREE.SphereGeometry(2, 32, 32);
                const layerTwoWeightMaterial = new THREE.MeshNormalMaterial();
                const layerTwoWeightMesh = new THREE.InstancedMesh(layerTwoWeightGeometry, layerTwoWeightMaterial, layerTwoMesh.count);
                layerTwoWeightMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                // move the neurons in each layer to the correct position
                // TODO move this logic to a function
                // input layer 
                for (let i = 0; i < inputLayerPositions.length; i++) {
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(inputLayerPositions[i])
                        inputLayerMesh.setMatrixAt(i, matrix)
                        inputWeightMesh.setMatrixAt(i, matrix)
                }

                // layer one
                for (let i = 0; i < layerOnePositions.length; i++) {
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(layerOnePositions[i])
                        layerOneMesh.setMatrixAt(i, matrix)
                        layerOneWeightMesh.setMatrixAt(i, matrix)
                }

                // layer two
                for (let i = 0; i < layerTwoPositions.length; i++) {
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(layerTwoPositions[i])
                        layerTwoMesh.setMatrixAt(i, matrix)
                        layerTwoWeightMesh.setMatrixAt(i, matrix)
                }

                // output layer
                for (let i = 0; i < outputLayerPositions.length; i++) {
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(outputLayerPositions[i])
                        outputLayerMesh.setMatrixAt(i, matrix)
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

        function getConnectionVertices() {

                const inputToLayerOneVertices = []
                const layerOneToLayerTwoVertices = []
                const layerTwoToOutputVertices = []

                // create weight vertices for input layer to hidden layer one
                for (let i = 0; i < inputLayerPositions.length; i++) {
                        for (let j = 0; j < layerOnePositions.length; j++) {
                                const startPoint = { x: inputLayerPositions[i].x, y: inputLayerPositions[i].y, z: inputLayerPositions[i].z }
                                const endPoint = { x: layerOnePositions[j].x, y: layerOnePositions[j].y, z: layerOnePositions[j].z }

                                inputToLayerOneVertices.push({ startPoint, endPoint })
                        }
                }

                // create weight vertices for hidden layer one to hidden layer two
                for (let i = 0; i < layerOnePositions.length; i++) {
                        for (let j = 0; j < layerTwoPositions.length; j++) {
                                const startPoint = { x: layerOnePositions[i].x, y: layerOnePositions[i].y, z: layerOnePositions[i].z }
                                const endPoint = { x: layerTwoPositions[j].x, y: layerTwoPositions[j].y, z: layerTwoPositions[j].z }

                                layerOneToLayerTwoVertices.push({ startPoint, endPoint })
                        }
                }

                // create weight vertices for hidden layer two to output layer
                for (let i = 0; i < layerTwoPositions.length; i++) {
                        for (let j = 0; j < outputLayerPositions.length; j++) {
                                const startPoint = { x: layerTwoPositions[i].x, y: layerTwoPositions[i].y, z: layerTwoPositions[i].z }
                                const endPoint = { x: outputLayerPositions[j].x, y: outputLayerPositions[j].y, z: outputLayerPositions[j].z }

                                layerTwoToOutputVertices.push({ startPoint, endPoint })
                        }
                }

                return {
                        inputToLayerOneVertices,
                        layerOneToLayerTwoVertices,
                        layerTwoToOutputVertices
                }
        }

        const loadInitialExamples = useCallback(async () => {
                const data = new MnistData()
                await data.load()
                const examples = data.nextTestBatch(20)
                const numExamples = examples.xs.shape[0];

                let tempColorBuffers = []

                for (let i = 0; i < numExamples; i++) {
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

        }, [])

        
        function processAnimationPackage(inputPixels,predictionInstance){

                const colorAttributeArray = []
                const prediction = predictionInstance.prediction
                const hiddenLayersActivations = predictionInstance.hiddenLayersActivations

                // create the inputLayerMesh's color buffer attribute
                const inputColorArray = Float32Array.from(inputPixels)
                colorAttributeArray.push(new THREE.InstancedBufferAttribute(inputColorArray, 4))

                // create hidden layer's color buffer attribute
                for(let i = 0; i < hiddenLayersActivations.length; i++){
                        const colorArray = Float32Array.from(hiddenLayersActivations[i])
                        colorAttributeArray.push(new THREE.InstancedBufferAttribute(colorArray, 1))
                }
                neuralNetwork.animationPackage = {colorAttributeArray: colorAttributeArray, prediction: prediction}
        }

        function visualizePretrainedModel() {
                // toggleShowCasing(true)
                togglePretrainedVisualization(!visualizationState)
        }
        const updateVisualizationState = useCallback(() => {
                // toggleShowCasing(newState)
                togglePretrainedVisualization(!visualizationState)
        }, [])


        function trainNetwork() {
                worker.postMessage({ action: 'trainNetwork' })
        }

        // this function is called when the user clicks the predict button
        // it randomly selects a test example, draws it on our inputLayer and predicts the number
        function predictInput() {
                // console.log('predicting input')
                worker.postMessage({ action: 'predictInput' })
                // updateVisualizationState()
                // loadXExamples()
        }

        function toggleLineAnimation() {
                setAnimateLines(!animateLines)
        }

        function animateInstancesToTarget(instanceMesh, targetPosition, speed){
                for (let i = 0; i < instanceMesh.count; i++) {
                        const currentMatrix = new THREE.Matrix4();
                        const currentPosition = new THREE.Vector3();
                
                        instanceMesh.getMatrixAt(i, currentMatrix);
                        currentPosition.setFromMatrixPosition(currentMatrix);
                
                        const dx = targetPosition.x - currentPosition.x;
                        const dy = targetPosition.y - currentPosition.y;
                        const dz = targetPosition.z - currentPosition.z;
                
                        const x = currentPosition.x + dx * speed;
                        const y = currentPosition.y + dy * speed;
                        const z = currentPosition.z + dz * speed;
                
                        const matrix = new THREE.Matrix4();
                        matrix.setPosition(new THREE.Vector3(x, y, z));
                
                        instanceMesh.setMatrixAt(i, matrix);
                }
                instanceMesh.instanceMatrix.needsUpdate = true;
        }

        function animateInputWeightsToTarget(targetLayer,animatedWeightMesh, speed) {
                animatedWeightMesh.forEach((segment, i) => {
                        if (segment) {
                                if(i % 10 == 0){
                                        const currentPosition = segment.end
                                        const targetPosition = targetLayer[i].end

                                        const dx = targetPosition.x - currentPosition.x;
                                        const dy = targetPosition.y - currentPosition.y;
                                        const dz = targetPosition.z - currentPosition.z;

                                        const x = currentPosition.x + dx * speed;
                                        const y = currentPosition.y + dy * speed;
                                        const z = currentPosition.z + dz * speed;
                                        segment.end.set(x, y, z)
                                }
                        }
                });
        }

        // TODO rename this function
        function forwardPass(action) {

                inputLayerRef.current.geometry.setAttribute('color', neuralNetwork.animationPackage.colorAttributeArray[0])
                inputLayerRef.current.geometry.getAttribute('color').needsUpdate = true;

                if (action == 'pass-input-to-one') {

                        // temporarily hardcoded targetPosition
                        const targetPosition = new THREE.Vector3(-7.5, -200, -7.5)

                        // animate the input layer weight instances to the target position
                        animateInstancesToTarget(neuralNetwork.networkMeshes.inputWeightMesh, targetPosition, 0.1)
                        
                        // animate input layer weight line segments
                        animateInputWeightsToTarget(inputLayerWeightsRef.current, animatedInputWeightsRef.current,0.1) 


                        // check if we are at the target position
                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()
                        neuralNetwork.networkMeshes.inputWeightMesh.getMatrixAt(0, currentMatrix)
                        currentPosition.setFromMatrixPosition(currentMatrix)

                        if (Math.abs(targetPosition.y) - Math.abs(currentPosition.y) < 1 && !animateLayerOneWeights) {

                                hiddenLayerOneRef.current.geometry.setAttribute('color', neuralNetwork.animationPackage.colorAttributeArray[1])
                                hiddenLayerOneRef.current.geometry.getAttribute('color').needsUpdate = true;

                                animateLayerOneWeights = true

                        }
                }
                else if (action == 'pass-one-to-two') {
                        const targetPosition = new THREE.Vector3(-7.5, -150, -7.5)
                        animateInstancesToTarget(neuralNetwork.networkMeshes.layerOneWeightMesh, targetPosition, 0.1)

                        animateInputWeightsToTarget(hiddenLayerOneWeightsRef.current,animatedHiddenLayerOneWeightsRef.current,0.1)

                        // check if we are at the target position
                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()
                        neuralNetwork.networkMeshes.layerOneWeightMesh.getMatrixAt(0, currentMatrix)
                        currentPosition.setFromMatrixPosition(currentMatrix)

                        if (Math.abs(targetPosition.y) - Math.abs(currentPosition.y) < 1 && !animateLayerTwoWeights) {
                                
                                hiddenLayerTwoRef.current.geometry.setAttribute('color', neuralNetwork.animationPackage.colorAttributeArray[2])
                                hiddenLayerTwoRef.current.geometry.getAttribute('color').needsUpdate = true;

                                animateLayerTwoWeights = true
                        }
                }
                else if (action == 'pass-two-to-output') {

                        // remember to set the target position value to the position of the predicted output value of the neural network
                        const targetPosition = new THREE.Vector3(-7.5, -150, 0)
                        animateInstancesToTarget(neuralNetwork.networkMeshes.layerTwoWeightMesh, targetPosition, 0.1)
                        animateInputWeightsToTarget(hiddenLayerTwoWeightsRef.current,animatedHiddenLayerTwoWeightsRef.current,0.1)


                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()
                        neuralNetwork.networkMeshes.layerTwoWeightMesh.getMatrixAt(0, currentMatrix)
                        currentPosition.setFromMatrixPosition(currentMatrix)

                        if (Math.abs(targetPosition.y) - Math.abs(currentPosition.y) < 1 && !animateOutputLayer) {
                                
                                // TODO if the prediction is correct set the color to green, else set it to red
                                outputLayerRef.current.setColorAt(neuralNetwork.animationPackage.prediction, new THREE.Color('green'))
                                outputLayerRef.current.instanceColor.needsUpdate = true;

                                animateOutputLayer = true       //set these to false after back propagation is complete  
                        }
                }

        }

        

        function backPropagation(action){

                if (action == 'output-to-two') {

                        // temporarily hardcoded targetPosition
                        const targetPosition = new THREE.Vector3(-7.5, -200, -7.5)

                        // animate the input layer instances to the target position
                        animateInstancesToTarget(neuralNetwork.networkMeshes.inputWeightMesh, targetPosition, 0.1)
                        
                        // check if we are at the target position
                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()
                        neuralNetwork.networkMeshes.inputWeightMesh.getMatrixAt(0, currentMatrix)
                        currentPosition.setFromMatrixPosition(currentMatrix)

                        if (Math.abs(targetPosition.y) - Math.abs(currentPosition.y) < 1 && !animateLayerOneWeights) {

                                hiddenLayerOneRef.current.geometry.setAttribute('color', neuralNetwork.animationPackage.colorAttributeArray[1])
                                hiddenLayerOneRef.current.geometry.getAttribute('color').needsUpdate = true;

                                animateLayerOneWeights = true

                        }
                }
                else if (action == 'two-to-one') {
                        const targetPosition = new THREE.Vector3(-7.5, -150, -7.5)
                        animateInstancesToTarget(neuralNetwork.networkMeshes.layerOneWeightMesh, targetPosition, 0.1)

                        // check if we are at the target position
                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()
                        neuralNetwork.networkMeshes.layerOneWeightMesh.getMatrixAt(0, currentMatrix)
                        currentPosition.setFromMatrixPosition(currentMatrix)

                        if (Math.abs(targetPosition.y) - Math.abs(currentPosition.y) < 1 && !animateLayerTwoWeights) {
                                
                                hiddenLayerTwoRef.current.geometry.setAttribute('color', neuralNetwork.animationPackage.colorAttributeArray[2])
                                hiddenLayerTwoRef.current.geometry.getAttribute('color').needsUpdate = true;

                                animateLayerTwoWeights = true
                        }
                }
                else if (action == 'one-to-input') {

                        // remember to set the target position value to the position of the predicted output value of the neural network
                        const targetPosition = new THREE.Vector3(-7.5, -150, 0)
                        animateInstancesToTarget(neuralNetwork.networkMeshes.layerTwoWeightMesh, targetPosition, 0.1)

                        const currentMatrix = new THREE.Matrix4()
                        const currentPosition = new THREE.Vector3()
                        neuralNetwork.networkMeshes.layerTwoWeightMesh.getMatrixAt(0, currentMatrix)
                        currentPosition.setFromMatrixPosition(currentMatrix)

                        if (Math.abs(targetPosition.y) - Math.abs(currentPosition.y) < 1 && !animateOutputLayer) {
                                
                                // TODO if the prediction is correct set the color to green, else set it to red
                                outputLayerRef.current.setColorAt(neuralNetwork.animationPackage.prediction, new THREE.Color('green'))
                                outputLayerRef.current.instanceColor.needsUpdate = true;

                                animateOutputLayer = true       //set these to false after back propagation is complete


                                
                        }
                }

        }

        useFrame(({ clock }) => {
                const time = clock.elapsedTime

                if (animateInputWeights) {
                        // console.log('calling forwardPass')
                        forwardPass('pass-input-to-one')

                }
                if (animateLayerOneWeights) {
                        // console.log('calling forward pass 2')
                        forwardPass('pass-one-to-two')
                }
                if (animateLayerTwoWeights ){
                        // console.log('calling forwardpass 3')
                        forwardPass('pass-two-to-output')
                }


        })

        return (
                <>
                        <group position={[0, 0, 100]} rotation={[Math.PI / 2, 0, 0]} onClick={() => setActive(!active)} >
                                <primitive ref={inputLayerRef} object={neuralNetwork.networkMeshes.inputLayerMesh} />
                                <primitive object={neuralNetwork.networkMeshes.inputWeightMesh} />
                                <Segments
                                        limit={neuralNetwork.connectionVertices.inputToLayerOneVertices.length} lineWidth={0.01}>
                                        {neuralNetwork.connectionVertices.inputToLayerOneVertices.map((line, i) => (
                                                <Segment key={i}
                                                        ref={(r) => (inputLayerWeightsRef.current[i] = r)} 
                                                        color={'#396e04'}
                                                        start={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                        end={[line.endPoint.x, line.endPoint.y - 200, line.endPoint.z]}
                                                />
                                        ))}
                                </Segments>
                                {/* The line segments to animate */}
                                <Segments
                                        limit={neuralNetwork.connectionVertices.inputToLayerOneVertices.length} lineWidth={0.1}>
                                        {neuralNetwork.connectionVertices.inputToLayerOneVertices.map((line, i) => (
                                                <Segment key={i}
                                                        ref={(r) => (animatedInputWeightsRef.current[i] = r)} 
                                                        color={'#F8D628'}
                                                        start={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                        end={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                />
                                        ))}
                                </Segments>

                        </group>
                        <group position={[0, 0, -100]} rotation={[Math.PI / 2, 0, 0]} >
                                <primitive ref={hiddenLayerOneRef} object={neuralNetwork.networkMeshes.layerOneMesh} />
                                <primitive object={neuralNetwork.networkMeshes.layerOneWeightMesh} />
                                <Segments
                                        limit={neuralNetwork.connectionVertices.layerOneToLayerTwoVertices.length} lineWidth={0.2}>
                                        {neuralNetwork.connectionVertices.layerOneToLayerTwoVertices.map((line, i) => (
                                                <Segment key={i}
                                                        ref={(r) => (hiddenLayerOneWeightsRef.current[i] = r)} 
                                                        color={'#396e04'}
                                                        start={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                        end={[line.endPoint.x, line.endPoint.y - 150, line.endPoint.z]}
                                                />
                                        ))}
                                </Segments>
                                {/* The line segments to animate */}
                                <Segments
                                        limit={neuralNetwork.connectionVertices.layerOneToLayerTwoVertices.length} lineWidth={0.2}>
                                        {neuralNetwork.connectionVertices.layerOneToLayerTwoVertices.map((line, i) => (
                                                <Segment key={i}
                                                        ref={(r) => (animatedHiddenLayerOneWeightsRef.current[i] = r)} 
                                                        color={'#F8D628'}
                                                        start={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                        end={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                />
                                        ))}
                                </Segments>
                        </group>

                        <group position={[0, 0, -250]} rotation={[Math.PI / 2, 0, 0]} >
                                <primitive ref={hiddenLayerTwoRef} object={neuralNetwork.networkMeshes.layerTwoMesh} />
                                <primitive object={neuralNetwork.networkMeshes.layerTwoWeightMesh} />
                                <Segments
                                        limit={neuralNetwork.connectionVertices.layerTwoToOutputVertices.length} lineWidth={0.2}>
                                        {neuralNetwork.connectionVertices.layerTwoToOutputVertices.map((line, i) => (
                                                <Segment key={i}
                                                        ref={(r) => (hiddenLayerTwoWeightsRef.current[i] = r)} 
                                                        color={'#396e04'}
                                                        start={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                        end={[line.endPoint.x, line.endPoint.y - 150, line.endPoint.z]}
                                                />
                                        ))}
                                </Segments>
                                {/* The line segments to animate */}
                                <Segments
                                        limit={neuralNetwork.connectionVertices.layerTwoToOutputVertices.length} lineWidth={0.2}>
                                        {neuralNetwork.connectionVertices.layerTwoToOutputVertices.map((line, i) => (
                                                <Segment key={i}
                                                        ref={(r) => (animatedHiddenLayerTwoWeightsRef.current[i] = r)} 
                                                        color={'#F8D628'}
                                                        start={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                        end={[line.startPoint.x, line.startPoint.y, line.startPoint.z]}
                                                />
                                        ))}
                                </Segments>
                        </group>
                        <group position={[0, 0, -400]}  >
                                <primitive ref={outputLayerRef} object={neuralNetwork.networkMeshes.outputLayerMesh} />
                                {outputLabels.map((value, i) => (
                                        <group key={i} position={outputLabelPositions[i]}>
                                                <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                                                        <Text color="white" anchorX="center" key={i} scale={15}>
                                                                {value}
                                                        </Text>
                                                </Billboard>
                                        </group>
                                ))}
                        </group>
                        <OrbitControls enableRotate={rotationEnabled} maxDistance={950} />
                        <Stars count={50000} depth={400} />
                        <axesHelper />
                </>
        )
}

export default NeuralNetwork