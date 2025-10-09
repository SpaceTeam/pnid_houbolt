/*
 * This file contains a bunch of hardcoded hacks that don't neatly apply to the generic/configurable ECUI/PnID setup
 * but we need them anyways for some reason
 */

function startHeartbeatPoll()
{
    setInterval(pollHeartbeatState, 5000);
}

function pollHeartbeatState()
{
    stateUpdate("engine_ecu:GetGSEConnectionAbortEnable", 0);
    stateUpdate("engine_ecu:GetGSEConnectionAbortTimer", 0);
    stateUpdate("fuel_ecu:GetGSEConnectionAbortEnable", 0);
    stateUpdate("fuel_ecu:GetGSEConnectionAbortTimer", 0);
    stateUpdate("ox_ecu:GetGSEConnectionAbortEnable", 0);
    stateUpdate("ox_ecu:GetGSEConnectionAbortTimer", 0);
}

function setHeartbeatActive(active)
{
    let value = active ? 1 : 0;
    stateUpdate("engine_ecu:SetGSEConnectionAbortEnable", value);
    stateUpdate("fuel_ecu:SetGSEConnectionAbortEnable", value);
    stateUpdate("ox_ecu:SetGSEConnectionAbortEnable", value);
}
