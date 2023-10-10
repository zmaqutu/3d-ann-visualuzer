import './App.scss';
import { Canvas } from '@react-three/fiber'
import NeuralNetwork from './components/NeuralNetwork';
import React, { useEffect, useRef, useCallback, useState} from 'react'
import { OrbitControls, StatsGl } from '@react-three/drei';
import * as THREE from 'three'







function App() {

	let width = window.innerWidth;
	let height = window.innerHeight;

    const cameraPosition = useRef([0,0,575]);

	// const stats = useRef(document.createElement('div'));

	const [animateForwardPass, setAnimateForwardPass] = useState(false);
	const [trainNetwork, setTrainNetwork] = useState(false);
	const [predicting, setPredicting] = useState(false)

	// useEffect(() => {
	// 	stats.current.id = 'stats'
	// 	stats.current.style.position = 'absolute'
	// 	stats.current.style.top = '100px'
	// 	stats.current.style.left = '100px'
	// 	document.body.appendChild(stats.current)
		
	// 	return () => document.body.removeChild(stats.current)
	// }, [])
	
	function visualizePretrainedModel(){
	}
	const updateVisualizationState = useCallback(() => {
}	,[])

	function toggleWorldSetup(){
		console.log('togglingworld')
		// instancedMesh.setColorAt(4, new THREE.Color('yellow'))
		// instancedMesh.instanceColor.needsUpdate = true;

	}

	function startTrainingNetwork(){
		setTrainNetwork(!trainNetwork)
	}

	function startPrediction(){
		setPredicting(!predicting)
	}

	function toggleAnimation(){
		setAnimateForwardPass(!animateForwardPass)
	}

	// test code for instanced buffer geometry
	// const instanceGeometry = new THREE.BoxGeometry(10,10,10)
	// const instanceMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide,})
	// const instancedMesh = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, 10);

// 	useEffect(() => {
// 		const positions = []
// 		for(let j = -75; j < 75; j+=15){
// 			positions.push(new THREE.Vector3(j,-1,0))	
// 		}
// 		for(let i = 0; i < positions.length; i++){
// 			const matrix = new THREE.Matrix4()
// 			matrix.setPosition(positions[i])
// 			instancedMesh.setMatrixAt(i,matrix)
// 		}
// 		instancedMesh.instanceMatrix.needsUpdate = true;
// 		instancedMesh.setColorAt(2,new THREE.Color('hotpink'))
// 		console.log('useffect')

		
		
// }, [])


  	return (
		<>
			<div>
            	<button onClick={updateVisualizationState} dir={'rtl'}>Visualize Pretrained Model</button>
				<button onClick={toggleWorldSetup}>Setup Input</button>
				<button onClick={startPrediction}>Randomly Select Test Data and Predict</button>
				<button onClick={startTrainingNetwork}>Train Network</button>
				<button onClick={toggleAnimation}>Animate Lines</button>
            </div>
			<Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
				<NeuralNetwork animateForwardPass={animateForwardPass} trainNetwork={trainNetwork} predicting={predicting}/>
				{/* <StatsGl className='stats' horizontal={false}/> */}
			</Canvas>
		</>
  );
}

export default App;
