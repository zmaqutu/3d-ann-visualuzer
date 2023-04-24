import React, {useRef, useState, useEffect, forwardRef} from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'


function LineConnection(props) {
        const points = [props.start, props.end]
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        const lineMaterial = new THREE.LineBasicMaterial({color: 0x000ff, linewidth:50})
        const line = new THREE.Line(lineGeometry, lineMaterial)
        const lineRef = useRef()
        const randomColors = [0x0000ff, 0x00ff00,]
        useFrame((state,delta) => {
                // lineRef.current.rotation.x += delta
                // lineRef.current.rotation.y += delta

                // const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)]
                // lineRef.current.material.color = new THREE.Color(randomColor)
                // lineRef.current.material.needsUpdate = true

                // console.log('print')
                // setTimeout(() => {
                //         // Run after 100 milliseconds
                       
                // }, 100);
        })
        if(props.layer == 'hiddenLayerOne'){
                line.rotation.x = -Math.PI / 2;
                line.position.y += 55;
        }
        else if (props.layer == 'hiddenLayerTwo'){
                line.rotation.x = -Math.PI / 2;
                line.position.y += 155;
                // line.position.z += -155;
        }
        else if (props.layer == 'outputLayer'){
                line.rotation.x = -Math.PI / 2;
                line.position.y += 255;
                // line.position.z += -155;
        }
        
        // line.position.z += -5;

        // const [line, setLine] = useState(lineGeometry, lineMaterial)
        // setLine(new THREE.Line(lineGeometry, lineMaterial))
        useEffect(() => {
                // const points = [props.start, props.end]
                // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
                // const lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth:50})
                // const line = new THREE.Line(lineGeometry, lineMaterial)
                // line.rotation.x = -Math.PI / 2;
                // line.position.y += 155;
                // setLine(line)
                // console.log(lineRef)

        }, [])




        return (
                <>
    		        <primitive object={line} ref={lineRef} />
                </>
                
                // <mesh>
                //         <lineGeometry />
                //         <lineBasicMaterial color="hotpink" />
                // </mesh>
        )
        }

export default LineConnection