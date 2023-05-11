import React, {useRef, useState, useEffect, forwardRef} from 'react'
import * as THREE from 'three'
import LineConnection from './LineConnection'
import { useFrame } from '@react-three/fiber'


const Neuron = forwardRef(function Neuron(props,ref) {
        const currentGeometry = new THREE.BoxGeometry(10,10,10)
        const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: props.color})

        const neuronMesh = new THREE.Mesh(currentGeometry, currentMaterial)

        neuronMesh.position.set(props.position[0], props.position[1], props.position[2])

	const neuronRef = useRef()
	// [{start, end}]
        const [linePositions, setLinePositions] = useState([])

        useEffect(() => {
		// getLinePositions()
		// console.log('props',)
		if(props.layer == 'hiddenLayerOne'){
			getLinePositions()
		}
		else if(props.layer == 'hiddenLayerTwo'){
			// console.log(ref)
			getLinePositions()
		}
		else if(props.layer == 'outputLayer'){
			getLinePositions()
		}
        }, [])
        const randomColors = [0x000000, 0xfcba03,]

	useFrame((state,delta) => {
        //         // lineRef.current.rotation.x += delta
        //         // lineRef.current.rotation.y += delta

                // const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)]
                // neuronRef.current.material.color = new THREE.Color(randomColor)
                // neuronRef.current.material.needsUpdate = true
                
        //         // console.log('print')
        //         // setTimeout(() => {
        //         //         // Run after 100 milliseconds
                       
        //         // }, 100);
        })

      function getLinePositions(){
	let positions = []
	ref.current.children.forEach( (child) => {

		let startWorldPosition = new THREE.Vector3()
		// neuronRef.current.localToWorld(startWorldPosition)
		neuronRef.current.getWorldPosition(startWorldPosition)
		// startWorldPosition.setFromMatrixPosition(neuronRef.current.matrixWorld)


		let endWorldPosition = new THREE.Vector3()
		// child.localToWorld(endWorldPosition)
		child.getWorldPosition(endWorldPosition)
		// endWorldPosition.setFromMatrixPosition(child.matrixWorld)


		// positions.push({start: child.position.clone(), end: neuronRef.current.position.clone()})
		positions.push({start: startWorldPosition, end: endWorldPosition.clone()})

	})
	setLinePositions(positions)
      }
      function mouseDownHandler(event){
	event.stopPropagation()
	console.log('mouseDownHandler', event)

      }

  return (
	<>
    		<primitive object={neuronMesh} ref={neuronRef} onMouseOver={e => console.log('over')}/>
		{
			// linePositions.map( (line, index) => ()
			linePositions.map( (line, index) => (
				<LineConnection key = {index} start = {line.start} end = {line.end} layer={props.layer}/>
			))
			// <LineConnection  />

		}
	</>
  )
})

export default Neuron