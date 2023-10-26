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

	// Use a ternary operator to conditionally set the image source
	const imageSrc = animateForwardPass
		? require('./assets/pause1.png') // Path to the enabled button image
		: require('./assets/play1.png'); // Path to the disabled button image

  	return (
		<>
			<div className='header'>
            	{/* <button onClick={updateVisualizationState} dir={'rtl'}>Visualize Pretrained Model</button>
				<button onClick={toggleWorldSetup}>Setup Input</button>
				<button onClick={startPrediction}>Randomly Select Test Data and Predict</button> */}
				{ trainNetwork ?
					null :
					<button onClick={startTrainingNetwork}>
					<img src={require('./assets/train.png')} alt="play"/>
					</button>
				}
				<button onClick={toggleAnimation}>
					<img src={imageSrc} alt="play"/>
				</button>
            </div>
			<div className='metrics'>
				<div className='batchNo'>Batch: ---</div>
				<div className='loss'>Batch Loss: ---</div>
				<div className='accuracy'>Batch Accuracy: ---</div>
			</div>
			<Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
				<NeuralNetwork animateForwardPass={animateForwardPass} trainNetwork={trainNetwork} predicting={predicting}/>
				{/* <StatsGl className='stats' horizontal={false}/> */}
			</Canvas>
		</>
  );
}

export default App;
