using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace DriveNow.API.Hubs;

/// <summary>
/// SignalR Hub cho User realtime updates (lock/unlock, status changes)
/// </summary>
[Authorize]
public class UserHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Join user to their personal group for targeted updates
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        // Join to users_list group if Admin (to receive user list updates)
        if (!string.IsNullOrEmpty(role) && role == "Admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "users_list");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        if (!string.IsNullOrEmpty(role) && role == "Admin")
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "users_list");
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}

