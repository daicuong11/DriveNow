using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace DriveNow.API.Hubs;

/// <summary>
/// SignalR Hub cho Permission realtime updates
/// </summary>
[Authorize]
public class PermissionHub : Hub
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
        
        if (!string.IsNullOrEmpty(role))
        {
            // Also join user to their role group for role-based updates
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
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
        
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"role_{role}");
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}

