'''
* Author: Asher Roland
* Created: 11/9/2024
* (c) Copyright by Fusion Pixel Studios
* License: MIT
'''

#!/usr/bin/env python
resolve = bmd.scriptapp('Resolve')
project_manager = resolve.GetProjectManager()
media_storage = resolve.GetMediaStorage()
project = project_manager.GetCurrentProject()
timeline = project.GetCurrentTimeline()
media_pool = project.GetMediaPool()
gallery = project.GetGallery()

print(resolve)
print(project_manager)
print(media_storage)
print(project)
print(timeline)
print(media_pool)
print(gallery)