using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MotoTripOrganizer.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSharedToExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsShared",
                table: "Expenses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsShared",
                table: "Expenses");
        }
    }
}
