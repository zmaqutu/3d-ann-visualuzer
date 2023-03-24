import React, {useRef, useState, useEffect} from 'react'
import * as THREE from 'three'


function Neuron(props) {
        const currentGeometry = new THREE.BoxGeometry(10,10,10)
        const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: props.color})

        const neuronMesh = new THREE.Mesh(currentGeometry, currentMaterial)

        neuronMesh.position.set(props.position[0], props.position[1], props.position[2])

  return (
    <primitive object={neuronMesh} />
  )
}

export default Neuron