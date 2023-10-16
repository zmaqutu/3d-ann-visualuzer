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

function animateLinesToTarget(targetLayer,animatedWeightMesh, speed, isReverse = false) {
    if(isReverse){
    }
    else{
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
    
}