--[[
* Author: Asher Roland
* Created: 11/9/2024
* (c) Copyright by Fusion Pixel Studios
* License: MIT
]]

local fu = fu or app:GetFusion()
local ui = fu.UIManager
local disp = bmd.UIDispatcher(ui)

local Labels_CSS = [[
    QLabel
    {
        color: rgb(255, 255, 255);
        font-size: 30px;
        font-weight: 300;
        font-family: 'Arial';
    }
    QLabel:!enabled
    {
        color: rgb(150, 150, 150);
    }
]]

local Buttons_CSS = [[
    QPushButton
    {
        border: 1px solid transparent;
        border-radius: 8px;
        background-color: rgb(0,0,0);
        color: white;
        font-size: 20px;
        font-weight: 300;
        font-family: 'Arial';
    }
    QPushButton:hover
    {
        background-color: rgb(100, 100, 100);
        color: yellow;
    }
    QPushButton:pressed
    {
        background-color: rgb(255,255,255);
        color: black;
    }
    QPushButton:!enabled
    {
        background-color: rgb(50,50,50);
        color: rgb(150,150,150);
    }
]]

local window = disp:AddWindow({
    ID = 'myWindow',
    WindowTitle = 'My Window',

    ui:VGroup{
        ID = 'root',
        FixedSize = { 600, 800 },
        ui:Label{ ID = 'Label1', Text = 'This is a Label', WordWrap = true, Alignment = { AlignCenter = true }, Weight = 0, StyleSheet = Labels_CSS },
        ui:Tree{ ID = 'Tree1', ColumnCount = 2, SortingEnabled = false, ItemsExpandable = false, ExpandsOnDoubleClick = false, HeaderHidden = false, RootIsDecorated = true, Icon = ui:Icon({File = '/PATH/TO/ICON.png'}), IconSize = { h, w }, Animated = true, AllColumnsShowFocus = false, WordWrap = true, TreePosition = 'center', SelectionMode = 'ExtendedSelection', UniformRowHeights = true, Indentation = false, AutoScroll = true, TabKeyNavigation = true, AlternatingRowColors = true, FrameStyle = 3, LineWidth = 5, FrameRect = true, FrameShadow = true, Alignment = { AlignCenter = true }, Weight = 1, StyleSheet = [[color: white; font-size: 20px; font-weight: 500; font-family: 'Arial';]] },
    }
})

local winItms = window:GetItems()

function window.On.Button1.Clicked(ev)
    
end

function window.On.myWindow.Close(ev)
    disp:ExitLoop()
end

window:RecalcLayout()
window:Show()
disp:RunLoop()
window:Hide()