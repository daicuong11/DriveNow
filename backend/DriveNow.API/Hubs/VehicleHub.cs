using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace DriveNow.API.Hubs;

/// <summary>
/// SignalR Hub cho Vehicle realtime updates
/// </summary>
[Authorize]
public class VehicleHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        // Có thể join vào groups nếu cần
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    // Method để client có thể subscribe vào vehicle updates
    public async Task SubscribeToVehicle(int vehicleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"vehicle_{vehicleId}");
    }

    public async Task UnsubscribeFromVehicle(int vehicleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"vehicle_{vehicleId}");
    }
}

