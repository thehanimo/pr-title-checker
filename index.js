import * as core from '@actions/core'
import * as github from '@actions/github'

const separator = '--------------------------'
const urlTicket = 'https://support.apps.darva.com/browse/SINAPPSHAB-'
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
const issue_number = github.context.issue.number
const { Octokit } = require('@octokit/action')
const octokit =new Octokit()
let JIRA_TICKETS = []
let  JIRA_TICKETS_IN_BODY=[]
const firstbody=github.context.payload.pull_request.body
async function run() {
  try {
    const title = github.context.payload.pull_request.title
    const labels = github.context.payload.pull_request.labels
    const getJiraTicketsFromPrTitle = () => {
      JIRA_TICKETS = title.split('-')[0].split('|')
    }
    const buildCommentBody = (firstbody) => {
      const ticket= 'Tickets:'
      let tab=[]
      let urlWithSeparator=''
      JIRA_TICKETS.map((e)=> {
      tab.push('\r\n',urlTicket.concat(e))
      })

      if (firstbody==undefined){
        core.info(`test firstbody == undefined ${firstbody}`) 
        firstbody=''
      }
      else {
          if(firstbody && firstbody.toString().includes(urlTicket)){
            if(firstbody.toString().includes(separator)){
              firstbody = firstbody.split(separator)[1]
              core.info(`firstbody ${firstbody}`) 
            }    
          }
          }

          core.info(`tab$ {tab}`) 
      urlWithSeparator=ticket.concat('\r\n',...tab).concat('\r\n', separator)
     return urlWithSeparator.concat('\r\n', firstbody)
    }
    const pattern = /\d{4,5}/
    const titleContainsJiraNumbers = pattern.test(title, 'i')
    if (titleContainsJiraNumbers) {
      getJiraTicketsFromPrTitle()
      core.setOutput('JIRA_TICKETS', JIRA_TICKETS)
      const bd = buildCommentBody(firstbody)
      await createOrUpdateComment(bd)
    } else {
      await addLabel('NotLinkedToJira')
      core.setOutput('JIRA_TICKETS', [])
    }
  } catch (error) {
    core.info(error)
  }
}

async function createOrUpdateComment(bd) {
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: issue_number,
    body:bd,
  })
}
async function addLabel(name) {
  let addLabelResponse = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [name],
  })
}
if (octokit) {
  run()
}