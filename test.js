/*
* Author: Asher Roland
* Created: 11/11/2024
* (c) Copyright by Fusion Pixel Studios
* License: MIT
*/

const path = require('path');
if (process.platform === 'darwin') {
    WorkflowIntegration = require(path.join(__dirname, 'WorkflowIntegration_Mac.node'));
} else {
    WorkflowIntegration = require(path.join(__dirname, 'WorkflowIntegration_Win.node'));
}

let isInitialized = WorkflowIntegration.Initialize('com.AsherRoland.TextPlugin');
if (!isInitialized) {
    console.error('Failed to initialize Workflow Integration');
}

const resolve = WorkflowIntegration.GetResolve();
const fusion = resolve.Fusion();
const projectManager = resolve.GetProjectManager();
const mediaStorage = resolve.GetMediaStorage();
const project = projectManager.GetCurrentProject();
const timeline = project.GetCurrentTimeline();
const mediaPool = project.GetMediaPool();
const gallery = project.GetGallery();