import './App.scss';
import { Canvas } from '@react-three/fiber'
import NeuralNetwork from './components/NeuralNetwork';
import React, { useEffect, useRef, useCallback, useState} from 'react'
import { StatsGl } from '@react-three/drei';






function App() {

	let width = window.innerWidth;
	let height = window.innerHeight;

    const cameraPosition = useRef([0,0,575]);

	// const stats = useRef(document.createElement('div'));

	const [animateForwardPass, setAnimateForwardPass] = useState(false);

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
	}

	function trainNetwork(){
	}

	function predictInput(){
	}

	function toggleAnimation(){
		setAnimateForwardPass(!animateForwardPass)
	}

  	return (
		<>
			<div>
            	<button onClick={updateVisualizationState} dir={'rtl'}>Visualize Pretrained Model</button>
				<button onClick={toggleWorldSetup}>Setup Input</button>
				<button onClick={predictInput}>Randomly Select Test Data and Predict</button>
				<button onClick={trainNetwork}>Train Network</button>
				<button onClick={toggleAnimation}>Animate Lines</button>
            </div>
			<Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
				<NeuralNetwork animateForwardPass={animateForwardPass}/>
				{/* <StatsGl className='stats' horizontal={false}/> */}
			</Canvas>
		</>
  );
}

export default App;
