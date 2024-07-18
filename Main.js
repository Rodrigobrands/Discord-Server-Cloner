const { Client } = require('v11-discord.js'),
    client = new Client();

const { prompt } = require('enquirer')
var colors = require('@libertyio/colors-node-js')

colors.setTheme({
  error: 'red',
  ASCII: 'brightMagenta'
});
const gradient = require('gradient-string');

//const delay = async(ms) => new Promise(resolve => setTimeout(resolve, ms))
// não, isso não salva seu token, literalmente um open source
async function run() {

    await logAscii()
    process.title = '@Light Store | Light Cloner [Inicio]'

    const config = await prompt([{
            type: 'input',
            name: 'token',
            message: 'Coloque o token da sua conta'
        }, {
            type: 'input',
            name: 'original',
            message: 'Coloqur o id do servidor que será copiado'
        },
        {
            type: 'input',
            name: 'Alvo',
            message: 'Coloque o id do servidor que ira receber as alterações'
        }
    ])
    const { token, original, target } = config

    client.on('ready', async() => {
        logAscii()
        const guilds = [await client.guilds.get(original), await client.guilds.get(target)]
        guilds.forEach(g => {
            if (!g) {
                log('Servidor desconhecido, verifique o ID (ID errado ou servidor não existe)', 3)
                process.exit(1)
            }
        })
// well yeah frick 
        let itens = {
            text: guilds[0].channels.filter(c => c.type === 'text').sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(c => c),
            voice: guilds[0].channels.filter(c => c.type === 'voice').sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(c => c),
            category: guilds[0].channels.filter(c => c.type === 'category').sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(c => c),
            roles: guilds[0].roles.sort((a, b) => b.calculatedPosition - a.calculatedPosition).map(r => r)
        }
        process.title = `@Light Store | Light cloner [Clonando ${guilds[0].name}]`;

        log('Deletando todos os canais e cargos do servidor...', 1)
        await guilds[1].channels.forEach(c => c.delete().catch(() => {}))
        await guilds[1].roles.map(r => r.delete().catch((() => {})))

        await guilds[1].setIcon(guilds[0].iconURL)
        await guilds[1].setName(`${guilds[0].name} Cloner By: Light Store`)

        for (let role of itens.roles) {
            if (guilds[1].roles.get(role.id)) continue;

            guilds[1].createRole({
                name: role.name,
                type: role.type,
                color: role.color,
                permissions: role.permissions,
                managed: role.managed,
                mentionable: role.mentionable,
                position: role.position
            }).then(r => log(`O cargo: ${r.name} foi criado com sucesso`, 1))
        }

        await guilds[0].emojis.forEach(e => {
            if (guilds[1].emojis.get(e.id)) return;

            guilds[1].createEmoji(e.url, e.name).then(c => log(`O emoji: ${c} Foi criado com sucesso`, 1));
        })

        itens['category'].forEach(async(category) => {
            if (guilds[1].channels.get(category.id)) return;

            await guilds[1].createChannel(category.name, {
                type: 'category',
                permissionOverwrites: category.permissionOverwrites.map(v => {
                    let target = guilds[0].roles.get(v.id);
                    if (!target) return;
                    return {
                        id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                        allow: v.allow || 0,
                        deny: v.deny || 0,
                    };
                }).filter(v => v),
                position: category.position
            }).then(c => {
                log(`A categoria: ${c.name} foi criada com sucesso`, 1)
            })
        })

        for (let channel of itens.text) {
            if (guilds[1].channels.get(channel.id)) continue;

            if (!channel.parent) {
                if (channel.topic) await guilds[1].createChannel(channel.name, {
                    type: 'text',
                    permissionOverwrites: channel.permissionOverwrites.map(v => {
                        let target = guilds[0].roles.get(v.id);
                        if (!target) return;
                        return {
                            id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                            allow: v.allow || 0,
                            deny: v.deny || 0,
                        };
                    }).filter(v => v),
                    position: channel.position
                }).then(c => c.setTopic(channel.topic))
            } else {
                let chn = await guilds[1].createChannel(channel.name, {
                    type: 'text',
                    permissionOverwrites: channel.permissionOverwrites.map(v => {
                        let target = guilds[0].roles.get(v.id);
                        if (!target) return;
                        return {
                            id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                            allow: v.allow || 0,
                            deny: v.deny || 0,
                        };
                    }).filter(v => v),
                    position: channel.position
                })
                if (channel.topic) chn.setTopic(channel.topic);

                if (guilds[1].channels.find(c => c.name == channel.parent.name)) chn.setParent(guilds[1].channels.find(c => c.name == channel.parent.name).id);
                else {
                    var cat = await guilds[1].createChannel(channel.parent.name, {
                        type: 'category',
                        permissionOverwrites: channel.permissionOverwrites.map(v => {
                            let target = guilds[0].roles.get(v.id);
                            if (!target) return;
                            return {
                                id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                                allow: v.allow || 0,
                                deny: v.deny || 0,
                            };
                        }).filter(v => v),
                        position: channel.position
                    });
                    chn.setParent(cat);
                }
            }
            log(`O canal: ${channel.name} Foi criado com sucesso`, 1)
        }

        for (let channel of itens.voice) {
            if (guilds[1].channels.get(channel.id)) continue;

            if (!channel.parent) {
                if (channel.topic) await guilds[1].createChannel(channel.name, {
                    type: 'voice',
                    permissionOverwrites: channel.permissionOverwrites.map(v => {
                        let target = guilds[0].roles.get(v.id);
                        if (!target) return;
                        return {
                            id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                            allow: v.allow || 0,
                            deny: v.deny || 0,
                        };
                    }).filter(v => v),
                    position: channel.position,
                    userLimit: channel.userLimit
                })
            } else {
                let chn = await guilds[1].createChannel(channel.name, {
                    type: 'voice',
                    permissionOverwrites: channel.permissionOverwrites.map(v => {
                        let target = guilds[0].roles.get(v.id);
                        if (!target) return;
                        return {
                            id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                            allow: v.allow || 0,
                            deny: v.deny || 0,
                        };
                    }).filter(v => v),
                    position: channel.position,
                    userLimit: channel.userLimit
                })

                if (guilds[1].channels.find(c => c.name == channel.parent.name)) chn.setParent(guilds[1].channels.find(c => c.name == channel.parent.name).id);
                else {
                    var cat = await guilds[1].createChannel(channel.parent.name, {
                        type: 'category',
                        permissionOverwrites: channel.permissionOverwrites.map(v => {
                            let target = guilds[0].roles.get(v.id);
                            if (!target) return;
                            return {
                                id: guilds[1].roles.find(r => r.name == target.name) || guilds[1].id,
                                allow: v.allow || 0,
                                deny: v.deny || 0,
                            };
                        }).filter(v => v),
                        position: channel.position,
                    });
                    chn.setParent(cat);
                }
            }
            log(`O canal: ${channel.name} foi criado com sucesso`, 1)
        }
    })

    client.login(`${token}`.replace(/"/g, ''))
        .catch(() => {
            logAscii()
            log('Ops algo esta errado verifique seu token e tente novamente' .error, 3)
        })
}

async function logAscii() {
    console.clear()
    console.log(gradient.mind(`

                Painel de clonar servidor
                                          ┓ •  ┓     ┓        
                                          ┃ ┓┏┓┣┓╋  ┏┃┏┓┏┓┏┓┏┓
                                          ┗┛┗┗┫┛┗┗  ┗┗┗┛┛┗┗ ┛ 
                                              ┛                 
                        
O melhor Cloner do mercado | Feito pela equipe da light Store!
`))
}

async function log(message, type) {
    switch (type) {
        case 1:
            await console.log(` [\u2713] ${message}`.green)
            break;
        case 2:
            await console.log(` [\u26A0] ${message}`.yellow)
            break;
        case 3:
            await console.log(` [\u274C] ${message}`.red)
            break;
    }
}
run()