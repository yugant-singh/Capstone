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
            volumes: [
                {
                    name: "workspace-volume",
                    emptyDir: {}
                }
            ],
            initContainers: [
                {
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
                    name: "init-container",
                    command: ["sh", "-c", "cp -r /workspace/.  /seed/"],
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/seed"
                        }
                    ]
                }
            ],
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
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                },




                {
                    image: "agent",
                    imagePullPolicy: "IfNotPresent",
                    name: "agent-container",
                    ports: [
                        {
                            containerPort: 3000, name: "http"
                        }],
                    resources: {
                        limits: {
                            cpu: '500m', memory: '1Gi'
                        },
                        requests: {
                            cpu: '250m', memory: '500Mi'
                        }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }

            ]

        }
    }
    const response = await k8sCoreV1Api.createNamespacedPod({
        namespace: "default",
        body: podManifest
    })

    return response
}