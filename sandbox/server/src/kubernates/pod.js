import { k8sCoreV1Api } from '../kubernates/config.js'

export async function createPod(sandoxId) {
    const podManifest = {
        metadata: {
            name: `sandbox-pod-${sandoxId}`,
            labels: {
                app: 'sandbox',
                sandboxId: sandoxId
            }
        },
        spec: {
            containers: [
                {
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
                    name: "sandbox-container",
                    ports: [
                        {

                            containerPort: 5173
                        }
                    ],
                    resources: {
                        limits: {
                            cpu: '500m',
                            memory: '512Mi'
                        },
                        requests: {
                            cpu: '250m',
                            memory: '256Mi'
                        }
                    }
                }
            ]
        }
    }
    const response = await k8sCoreV1Api.createNamespacedPod({
        namespace:"default",
        body:podManifest
    })

    return response
}