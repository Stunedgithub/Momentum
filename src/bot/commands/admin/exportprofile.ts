export { }

import { CommandInteraction, PermissionFlagsBits } from "discord.js";
const { SlashCommandBuilder } = require('discord.js');
const Users = require('../../../model/user');
const Profiles = require('../../../model/profiles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exportprofile')
        .setDescription('Sends you your profile as a file so you can import it later. Useful for devs.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction: CommandInteraction) {

        const user = await Users.findOne({ discordId: interaction.user.id });
        const profile = await Profiles.findOne({ accountId: user.accountId });
        if (!user) return interaction.reply({ content: "That user does not own an account", ephemeral: true });
        if(!profile) return interaction.reply({ content: "That user does not have a profile", ephemeral: true });

        const buffer = Buffer.from(JSON.stringify(profile));

        await interaction.user.send({ content: "Here is your profile as a file. You can import it later using the importprofile command.", files: [{ attachment: buffer, name: "profile.json" }] })
        await interaction.reply({ content: "Successfully sent you your profile as a file. Check your DMs", ephemeral: true });

    },
};