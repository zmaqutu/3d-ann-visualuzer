import './App.scss';
import { Canvas } from '@react-three/fiber'
import NeuralNetwork from './components/NeuralNetwork';
import React, { useEffect, useRef, useCallback} from 'react'




function App() {

	let width = window.innerWidth;
	let height = window.innerHeight;

    const cameraPosition = useRef([0,0,575]);

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

	function toggleLineAnimation(){
	}

  	return (
		<>
			<div>
            	<button onClick={updateVisualizationState} dir={'rtl'}>Visualize Pretrained Model</button>
				<button onClick={toggleWorldSetup}>Setup Input</button>
				<button onClick={predictInput}>Randomly Select Test Data and Predict</button>
				<button onClick={trainNetwork}>Train Network</button>
				<button onClick={toggleLineAnimation}>Animate Lines</button>
            </div>
			<Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
				<NeuralNetwork />
			</Canvas>
		</>
  );
}

export default App;
