import React, {useRef, useState, useEffect, forwardRef} from 'react'
import * as THREE from 'three'


function LineConnection(props) {
        const points = [props.start, props.end]
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        const lineMaterial = new THREE.LineBasicMaterial({color: 0x000ff, linewidth:50})
        const line = new THREE.Line(lineGeometry, lineMaterial)
        if(props.layer == 'hiddenLayerOne'){
                line.rotation.x = -Math.PI / 2;
                line.position.y += 155;
        }
        else if (props.layer == 'hiddenLayerTwo'){
                line.rotation.x = -Math.PI / 2;
                line.position.y += 255;
                // line.position.z += -155;
        }
        else if (props.layer == 'outputLayer'){
                line.rotation.x = -Math.PI / 2;
                line.position.y += 355;
                // line.position.z += -155;
        }
        
        // line.position.z += -5;

        // const [line, setLine] = useState(lineGeometry, lineMaterial)
        // setLine(new THREE.Line(lineGeometry, lineMaterial))
        // useEffect(() => {
        //         // const points = [props.start, props.end]
        //         // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        //         // const lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth:50})
        //         // const line = new THREE.Line(lineGeometry, lineMaterial)
        //         // line.rotation.x = -Math.PI / 2;
        //         // line.position.y += 155;
        //         // setLine(line)
        // }, [])




        return (
                <>
    		        <primitive object={line} />
                </>
        )
        }

export default LineConnection