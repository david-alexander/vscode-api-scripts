const vscode = require('vscode');
const k8s = require('@kubernetes/client-node');
const _ = require('lodash');

/**
 * Connect to the active Kubernetes context, and find all the Kubernetes `Deployment`s
 * in namespaces starting with `development-`.
 * 
 * Let the user pick one of these `Deployment`s to connect the NodeJS debugger to.
 * The debugger will be connected simultaneously to all `Pod`s belonging to the `Deployment`.
 * 
 * Assumes:
 *  * There is an active Kubernetes context, and the user has access to list `Deployment`s
 *    and `Pod`s in all namespaces.
 *  * The `Deployment` that the user selects consists of `Pod`s that are all running NodeJS,
 *    with the debug server accessible via the `podIP`, on port `9229` (i.e. `--inspect=0.0.0.0:9229` or similar).
 *  * The `podIP`s of the `Pod`s are directly accessible from VS Code - i.e. either you have
 *    a VPN connection into the cluster, or the VS Code server itself is running within the cluster.
 */
const run = async function run()
{
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const coreApi = kc.makeApiClient(k8s.CoreV1Api);
    const appsApi = kc.makeApiClient(k8s.AppsV1Api);

    const deployments = (await appsApi.listDeploymentForAllNamespaces()).body.items;
    const filteredDeployments = deployments.filter(deployment => (
        deployment.metadata?.namespace?.startsWith('development-')
    ));

    const selectedDeployment = await vscode.window.showQuickPick(
        filteredDeployments.map(deployment => ({
            label: `${deployment.metadata?.namespace || ''}/${deployment.metadata?.name || ''}`,
            deployment
        })),
        {
            title: 'Select a deployment to debug...'
        }
    );

    if (selectedDeployment)
    {
        const allPodsInNamespace = (await coreApi.listNamespacedPod(selectedDeployment.deployment.metadata?.namespace)).body.items;
        
        const matchingPods = allPodsInNamespace.filter(pod => compareLabels(pod.metadata.labels, selectedDeployment.deployment.spec?.selector?.matchLabels));

        for (const pod of matchingPods)
        {
            if (pod.status?.podIP)
            {
                vscode.debug.startDebugging(vscode.workspace.workspaceFolders[0], {
                    "type": "node",
                    "request": "attach",
                    "name": `${pod.metadata?.namespace || ''}/${pod.metadata?.name || ''}`,
                    "address": pod.status.podIP,
                    "port": 9229
                });
            }
        }

    }
}

function compareLabels(a, b)
{
    a = sortLabels(a).filter(([k, v]) => k !== 'pod-template-hash');
    b = sortLabels(b);
    return _.isEqual(a, b);
}

function sortLabels(labels)
{
    return _.chain(Array.from(Object.entries(labels)))
            .sortBy(([k, v]) => k)
            .value();
}

module.exports = { run };
